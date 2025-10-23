import type { TauriUpdateManifest } from '../../types'
import { getOssConfigFromEnv, createOssClient, buildOssPath } from './client'

/**
 * 从 OSS 获取最新的 latest.json
 */
export async function getLatestReleaseFromOss(
  username: string,
  reponame: string
): Promise<TauriUpdateManifest | null> {
  try {
    const config = getOssConfigFromEnv()
    if (!config) {
      console.error('[OSS] OSS configuration not found')
      return null
    }

    const client = createOssClient(config)
    
    // 构建 latest.json 的路径：username/reponame/latest.json
    const objectKey = buildOssPath(config, `${username}/${reponame}/latest.json`)

    console.log(`[OSS] Fetching latest.json from: ${objectKey}`)

    // 从 OSS 获取文件
    const result = await client.get(objectKey)
    
    if (!result.content) {
      console.error('[OSS] Empty content from OSS')
      return null
    }

    // 解析 JSON
    const content = result.content.toString('utf-8')
    const manifest: TauriUpdateManifest = JSON.parse(content)

    return manifest
  } catch (error) {
    console.error('[OSS] Failed to fetch latest.json:', error instanceof Error ? error.message : error)
    return null
  }
}

