import type { Arch, Platform } from '../../utils/platforms'
import { getOssConfigFromEnv, createOssClient, buildOssPath } from './client'
import type { DownloadLatestJson } from './download-upload'

/**
 * 从 OSS 的 download/latest.json 获取指定平台和架构的下载 URL
 */
export async function getDownloadUrlFromOss(
    username: string,
    reponame: string,
    platform: string,
    arch: Arch
): Promise<{ url: string; fileName: string } | null> {
    try {
        const config = getOssConfigFromEnv()
        if (!config) {
            console.error('[OSS] OSS configuration not found')
            return null
        }

        const client = createOssClient(config)

        // 构建 latest.json 的路径：username/reponame/download/latest.json
        const objectKey = buildOssPath(config, `${username}/${reponame}/download/latest.json`)

        console.log(`[OSS] Fetching download latest.json from: ${objectKey}`)

        // 从 OSS 获取文件
        const result = await client.get(objectKey)

        if (!result.content) {
            console.error('[OSS] Empty content from OSS')
            return null
        }

        // 解析 JSON
        const content = result.content.toString('utf-8')
        const latestJson: DownloadLatestJson = JSON.parse(content)

        // 验证平台字符串
        const validPlatforms: Platform[] = ['darwin', 'windows', 'linux']
        if (!validPlatforms.includes(platform as Platform)) {
            console.error(`[OSS] Invalid platform: ${platform}`)
            return null
        }

        // 查找匹配的平台和架构
        const platformKey = `${platform}-${arch}`
        const platformInfo = latestJson[platformKey]

        if (!platformInfo) {
            console.error(`[OSS] Platform/arch combination not found: ${platformKey}`)
            return null
        }

        return {
            url: platformInfo.url,
            fileName: platformInfo.fileName
        }
    } catch (error) {
        console.error('[OSS] Failed to fetch download URL:', error instanceof Error ? error.message : error)
        return null
    }
}
