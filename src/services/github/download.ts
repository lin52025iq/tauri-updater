import { getGitHubToken, USER_AGENT } from './client'

/**
 * 获取 GitHub Asset 的原始 Response
 * 这是所有下载操作的基础函数
 */
export async function fetchGitHubAsset(assetUrl: string): Promise<Response> {
  const token = getGitHubToken()
  const headers: HeadersInit = {
    Accept: 'application/octet-stream',
    'user-agent': USER_AGENT,
  }

  if (token) {
    headers.Authorization = `token ${token}`
  }

  return fetch(assetUrl, {
    headers,
    redirect: 'follow'
  })
}

/**
 * 从 GitHub 下载文件并返回 Buffer
 * 用于服务端处理（如上传到 OSS）
 * @returns Buffer 成功时返回文件内容，失败时返回 null
 */
export async function downloadGitHubFile(assetUrl: string): Promise<Buffer | null> {
  try {
    const response = await fetchGitHubAsset(assetUrl)

    if (!response.ok) {
      console.error(`[GitHub] Failed to download file: ${response.status}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error(`[GitHub] Error downloading file:`, error instanceof Error ? error.message : error)
    return null
  }
}
