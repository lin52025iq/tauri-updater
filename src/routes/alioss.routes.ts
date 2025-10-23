import { Hono } from 'hono'
import { getLatestRelease } from '../services/github'
import { getLatestReleaseFromOss, checkUpdateFromOss, uploadReleaseAssetsToOss } from '../services/alioss'
import type { Arch } from '../types'

const routename = 'alioss'

/**
 * AliOSS 相关路由
 */
export const aliossRoutes = new Hono()

// 从 OSS 获取最新发布版本信息
aliossRoutes.all(`/${routename}/:username/:reponame/latest`, async (c) => {
  const { username, reponame } = c.req.param()
  const manifest = await getLatestReleaseFromOss(username, reponame)
  return manifest ? c.json(manifest) : c.notFound()
})

// 从 OSS 检查更新
aliossRoutes.get(`/${routename}/check/:username/:reponame/:platform/:arch/:version`, async (c) => {
  const params = c.req.param()

  return checkUpdateFromOss({
    ...params,
    arch: params.arch as Arch,
  })
})

// 上传 Release 资产到 OSS
aliossRoutes.get(`/${routename}/:username/:reponame/upload`, async (c) => {
  try {
    const { username, reponame } = c.req.param()

    // 获取最新的 Release
    const release = await getLatestRelease(username, reponame)

    if (!release) {
      return c.json({ error: 'Release not found' }, 404)
    }

    // 上传所有资产到 OSS（配置从环境变量读取）
    // 使用 tag_name 作为 release name（例如 v1.0.0）
    const { files, latestJsonContent } = await uploadReleaseAssetsToOss(
      release.assets,
      username,
      reponame,
      release.tag_name
    )

    // 获取 latest.json 的 URL
    const latestJsonFile = files.find(f => f.fileName === 'latest.json')
    
    if (!latestJsonFile) {
      return c.json({ error: 'latest.json upload failed' }, 500)
    }
    
    return c.json({
      success: true,
      latest_json_url: latestJsonFile.url,
      latest_json: latestJsonContent,
      uploaded_files: files.map(f => ({
        name: f.fileName,
        url: f.url,
        size: f.size
      }))
    })
  } catch (error) {
    console.error('[Upload] Error:', error instanceof Error ? error.message : error)
    return c.json(
      {
        error: 'Failed to upload to OSS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    )
  }
})

