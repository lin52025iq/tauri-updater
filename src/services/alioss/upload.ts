import type { GitHubAsset, TauriUpdateManifest } from '../../types'
import { downloadGitHubFile } from '../github/download'
import { getOssConfigFromEnv, uploadToOss } from './client'

/**
 * 从 URL 中提取文件名
 */
function extractFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    return pathParts[pathParts.length - 1]
  } catch {
    // 如果不是有效的 URL，尝试从路径中提取
    const parts = url.split('/')
    return parts[parts.length - 1]
  }
}

/**
 * 根据文件名查找对应的 asset
 */
function findAssetByFilename(assets: GitHubAsset[], filename: string): GitHubAsset | null {
  return assets.find(asset => asset.name === filename) || null
}

/**
 * 上传 GitHub Release 资产到 OSS
 * 配置从环境变量读取
 * 只上传 latest.json 中指定的文件，并生成新的 latest.json
 */
export async function uploadReleaseAssetsToOss(
  assets: GitHubAsset[],
  username: string,
  reponame: string,
  releaseName: string
): Promise<{
  files: { fileName: string; url: string; size: number }[]
  latestJsonContent: TauriUpdateManifest
}> {
  const results: { fileName: string; url: string; size: number }[] = []

  // 从环境变量获取配置
  const envConfig = getOssConfigFromEnv()
  if (!envConfig) {
    console.error('[OSS] OSS environment variables not configured')
    return {
      files: [],
      latestJsonContent: { version: '', notes: '', pub_date: '', platforms: {} }
    }
  }

  // 构建默认上传路径：username/reponame/releasename/
  const defaultPath = `${username}/${reponame}/${releaseName}/`

  // 合并环境变量的 dir 和默认路径
  const finalDir = envConfig.dir ? `${envConfig.dir}${defaultPath}` : defaultPath
  const configWithPath = { ...envConfig, dir: finalDir }

  console.log(`[OSS] Upload path: ${finalDir}`)

  // 1. 查找 latest.json 文件
  const latestJsonAsset = assets.find(asset =>
    asset.name === 'latest.json' || asset.name.endsWith('/latest.json')
  )

  if (!latestJsonAsset) {
    console.error('[OSS] latest.json not found in release assets')
    return {
      files: [],
      latestJsonContent: { version: '', notes: '', pub_date: '', platforms: {} }
    }
  }

  // 2. 下载并解析 latest.json
  const latestJsonBuffer = await downloadGitHubFile(latestJsonAsset.url)
  if (!latestJsonBuffer) {
    console.error('[OSS] Failed to download latest.json')
    return {
      files: [],
      latestJsonContent: { version: '', notes: '', pub_date: '', platforms: {} }
    }
  }
  
  const latestJsonContent = latestJsonBuffer.toString('utf-8')
  const manifest: TauriUpdateManifest = JSON.parse(latestJsonContent)

  // 3. 提取需要上传的文件列表，并建立平台到文件名的映射
  const platformToFilename: { [platform: string]: string } = {}
  const filesToUpload = new Set<string>()

  for (const platform in manifest.platforms) {
    const platformData = manifest.platforms[platform]
    const filename = extractFilenameFromUrl(platformData.url)
    platformToFilename[platform] = filename

    // 检查该文件是否在 assets 中存在
    const asset = findAssetByFilename(assets, filename)
    if (asset) {
      filesToUpload.add(filename)
    }
  }

  console.log(`[OSS] Found ${filesToUpload.size} files to upload (${Object.keys(manifest.platforms).length} platforms)`)

  // 4. 上传文件到 OSS，并记录新的 URL
  // 主文件和签名文件必须同时上传成功才算成功
  const uploadedFiles: { [filename: string]: string } = {}

  for (const filename of filesToUpload) {
    try {
      const asset = findAssetByFilename(assets, filename)
      if (!asset) {
        console.warn(`[OSS] Asset not found: ${filename}, skipping...`)
        continue
      }

      // 查找对应的平台名称
      const platformName = Object.keys(platformToFilename).find(
        platform => platformToFilename[platform] === filename
      ) || filename

      // 检查是否有对应的签名文件
      const sigFilename = `${filename}.sig`
      const sigAsset = findAssetByFilename(assets, sigFilename)

      // 先下载主文件
      const fileBuffer = await downloadGitHubFile(asset.url)
      if (!fileBuffer) {
        console.error(`[OSS] Failed to download file: ${filename}`)
        continue
      }

      // 如果有签名文件，也下载它
      let sigBuffer: Buffer | null = null
      if (sigAsset) {
        sigBuffer = await downloadGitHubFile(sigAsset.url)
        if (!sigBuffer) {
          console.warn(`[OSS] Failed to download signature file: ${sigFilename}`)
        }
      }

      // 上传主文件
      const uploadUrl = await uploadToOss(configWithPath, fileBuffer, filename)

      // 如果有签名文件，也上传它
      let sigUploadUrl: string | null = null
      if (sigBuffer && sigAsset) {
        sigUploadUrl = await uploadToOss(configWithPath, sigBuffer, sigFilename)
      }

      // 只有到这里才算成功（主文件和签名文件都成功）
      uploadedFiles[filename] = uploadUrl

      results.push({
        fileName: filename,
        url: uploadUrl,
        size: asset.size,
      })

      if (sigUploadUrl && sigAsset) {
        results.push({
          fileName: sigFilename,
          url: sigUploadUrl,
          size: sigAsset.size,
        })
        console.log(`[OSS] ✓ ${platformName} (signed)`)
      } else {
        console.log(`[OSS] ✓ ${platformName}`)
      }

    } catch (error) {
      // 查找对应的平台名称用于错误日志
      const platformName = Object.keys(platformToFilename).find(
        platform => platformToFilename[platform] === filename
      ) || filename
      console.error(`[OSS] ✗ ${platformName}:`, error instanceof Error ? error.message : error)
    }
  }

  // 5. 生成新的 latest.json，只包含成功上传的平台
  // 重要：将所有 URL 替换为 OSS 地址
  const newManifest: TauriUpdateManifest = {
    ...manifest,
    platforms: {}
  }

  for (const platform in manifest.platforms) {
    const platformData = manifest.platforms[platform]
    const filename = platformToFilename[platform]
    const ossUrl = uploadedFiles[filename]

    // 只有成功上传的文件才添加到新的 manifest 中
    if (ossUrl) {
      newManifest.platforms[platform] = {
        signature: platformData.signature,
        url: ossUrl  // ✅ 这里使用的是 OSS URL，不是原始的 GitHub URL
      }
    } else {
      console.warn(`[OSS] Platform ${platform} skipped (file: ${filename})`)
    }
  }

  const includedPlatforms = Object.keys(newManifest.platforms).length
  const totalPlatforms = Object.keys(manifest.platforms).length

  // 6. 上传新的 latest.json 到 OSS
  const newJsonContent = JSON.stringify(newManifest, null, 2)
  const jsonBuffer = Buffer.from(newJsonContent, 'utf-8')
  const latestJsonUrl = await uploadToOss(configWithPath, jsonBuffer, 'latest.json')

  results.push({
    fileName: 'latest.json',
    url: latestJsonUrl,
    size: jsonBuffer.length,
  })

  console.log(`[OSS] ✓ Upload completed: ${includedPlatforms}/${totalPlatforms} platforms`)

  // 7. 同时上传一份 latest.json 到 /username/reponame 目录（不带 releaseName）
  // 这份 json 作为最新发布版本的 json
  const rootPath = `${username}/${reponame}/`
  const rootDir = envConfig.dir ? `${envConfig.dir}${rootPath}` : rootPath
  const configWithRootPath = { ...envConfig, dir: rootDir }
  
  console.log(`[OSS] Uploading latest.json to root path: ${rootDir}`)
  
  try {
    const rootLatestJsonUrl = await uploadToOss(configWithRootPath, jsonBuffer, 'latest.json')
    results.push({
      fileName: 'latest.json (root)',
      url: rootLatestJsonUrl,
      size: jsonBuffer.length,
    })
    console.log(`[OSS] ✓ Root latest.json uploaded`)
  } catch (error) {
    console.error(`[OSS] ✗ Failed to upload root latest.json:`, error instanceof Error ? error.message : error)
  }

  // 返回上传的文件列表和修改后的 latest.json 内容
  // newManifest 中的所有 URL 都已经是 OSS 地址
  return {
    files: results,
    latestJsonContent: newManifest  // ✅ 这是修改 URL 之后的新内容
  }
}

