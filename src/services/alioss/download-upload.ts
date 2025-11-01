import type { GitHubAsset } from '../../types'
import { ARCH_RULES, type Arch, type Platform } from '../../utils/platforms'
import { downloadGitHubFile } from '../github/download'
import { getOssConfigFromEnv, uploadToOss } from './client'

/**
 * 可分发的安装文件扩展名（仅包含可直接用于安装的文件类型）
 * - .dmg: macOS 磁盘镜像，可直接安装
 * - .exe: Windows 可执行安装程序
 * - .AppImage: Linux 应用镜像，可直接运行
 */
const PLATFORMS = {
    darwin: ['.dmg'],
    windows: ['.exe'],
    linux: ['.appimage']
}

/** 根据文件名判断是否是需要上传的文件 */
const isDistributableFile = (filename: string) => Object.values(PLATFORMS).flat().some(ext => filename.toLocaleLowerCase().endsWith(ext))

/** 根据文件名获取 平台和架构 */
const detectPlatformAndArch = (filename: string) => {
    const lowerName = filename.toLocaleLowerCase()

    let platform = undefined
    const platforms = Object.entries(PLATFORMS)
    platforms.forEach(([key, value]) => {
        if (value.some(v => lowerName.endsWith(v))) {
            platform = key
        }
    })

    if (!platform) return

    let arch = undefined
    const archs = Object.entries(ARCH_RULES)

    archs.forEach(([key, value]) => {
        if (value.some(v => lowerName.includes(v))) {
            arch = key
        }
    })

    if (!arch) return
    return [platform, arch] as [Platform, Arch]
}

/**
 * Download Latest JSON 结构
 */
export interface DownloadLatestJson {
    [platformKey: string]: {
        platform: Platform
        arch: Arch
        url: string
        fileName: string
    }
}

/**
 * 从 GitHub Release 上传可安装文件到 download 目录
 */
export async function uploadInstallableFilesToDownload(
    assets: GitHubAsset[],
    username: string,
    reponame: string
): Promise<{
    files: { fileName: string; url: string; size: number; platform: Platform; arch: Arch }[]
    latestJsonContent: DownloadLatestJson
    latestJsonUrl: string
}> {
    const results: { fileName: string; url: string; size: number; platform: Platform; arch: Arch }[] = []

    // 从环境变量获取配置
    const envConfig = getOssConfigFromEnv()
    if (!envConfig) {
        console.error('[OSS] OSS environment variables not configured')
        return {
            files: [],
            latestJsonContent: {},
            latestJsonUrl: ''
        }
    }

    // 构建上传路径：username/reponame/download/
    const downloadPath = `${username}/${reponame}/download/`
    const finalDir = envConfig.dir ? `${envConfig.dir}${downloadPath}` : downloadPath
    const configWithPath = { ...envConfig, dir: finalDir }

    console.log(`[OSS] Upload path for download files: ${finalDir}`)

    // 1. 筛选可安装文件
    const installableAssets = assets.filter(asset => isDistributableFile(asset.name))

    console.log(`[OSS] Found ${installableAssets.length} installable files out of ${assets.length} total assets`)

    // 2. 识别每个文件的平台和架构，并上传
    const platformMap: DownloadLatestJson = {}

    for (const asset of installableAssets) {
        const platformInfo = detectPlatformAndArch(asset.name)

        if (!platformInfo) {
            console.warn(`[OSS] Cannot detect platform or arch for ${asset.name}, skipping...`)
            continue
        }

        const [platform, arch] = platformInfo
        const platformKey = `${platform}-${arch}`

        // 如果该平台+架构组合已存在，保留文件大小更大的（通常是更新的版本）
        if (platformMap[platformKey]) {
            const existingSize = platformMap[platformKey]
            const existingAsset = assets.find(a => a.name === existingSize.fileName)
            if (existingAsset && existingAsset.size >= asset.size) {
                console.log(`[OSS] Skipping ${asset.name}, already have ${existingSize.fileName} for ${platformKey}`)
                continue
            }
            // 如果新文件更大，删除旧的映射
            console.log(`[OSS] Replacing ${existingSize.fileName} with ${asset.name} for ${platformKey}`)
        }

        try {
            // 下载文件
            const fileBuffer = await downloadGitHubFile(asset.url)
            if (!fileBuffer) {
                console.error(`[OSS] Failed to download file: ${asset.name}`)
                continue
            }

            // 上传到 OSS
            const uploadUrl = await uploadToOss(configWithPath, fileBuffer, asset.name)

            // 记录到结果
            results.push({
                fileName: asset.name,
                url: uploadUrl,
                size: asset.size,
                platform,
                arch
            })

            // 记录到平台映射
            platformMap[platformKey] = {
                platform,
                arch,
                url: uploadUrl,
                fileName: asset.name
            }

            console.log(`[OSS] ✓ Uploaded ${asset.name} (${platform}/${arch})`)
        } catch (error) {
            console.error(`[OSS] ✗ Failed to upload ${asset.name}:`, error instanceof Error ? error.message : error)
        }
    }

    // 3. 生成 latest.json
    const latestJsonContent: DownloadLatestJson = {}

    for (const [platformKey, info] of Object.entries(platformMap)) {
        latestJsonContent[platformKey] = info
    }

    // 4. 上传 latest.json
    const jsonContent = JSON.stringify(latestJsonContent, null, 2)
    const jsonBuffer = Buffer.from(jsonContent, 'utf-8')
    const latestJsonUrl = await uploadToOss(configWithPath, jsonBuffer, 'latest.json')

    console.log(`[OSS] ✓ Uploaded latest.json to download directory`)
    console.log(`[OSS] ✓ Upload completed: ${Object.keys(latestJsonContent).length} platform/arch combinations`)

    return {
        files: results,
        latestJsonContent,
        latestJsonUrl
    }
}
