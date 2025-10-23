import { fetchGitHubAsset } from './download'
import { notFound } from '../../utils/response'
import type { GitHubAsset } from '../../types'

/**
 * 下载 GitHub Asset 并返回 HTTP Response
 * 用于路由层直接返回给客户端
 */
export async function downloadGitHubAsset(assetUrl: string, filename: string): Promise<Response> {
  try {
    const response = await fetchGitHubAsset(assetUrl)

    if (!response.ok) {
      console.error(`Failed to fetch ${assetUrl}: ${response.status}`)
      return notFound()
    }

    const headers = new Headers(response.headers)
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)

    return new Response(response.body, { headers })
  } catch (error) {
    console.error('Error downloading asset:', error)
    return notFound()
  }
}

/**
 * 查找 Asset 签名
 */
export async function findAssetSignature(fileName: string, assets: GitHubAsset[]): Promise<string | null> {
  const signatureAsset = assets.find(
    asset => asset.name.toLowerCase() === `${fileName.toLowerCase()}.sig`
  )

  if (!signatureAsset) return null

  try {
    const response = await fetchGitHubAsset(signatureAsset.url)
    return response.ok ? await response.text() : null
  } catch (error) {
    console.error(`Failed to get signature for ${fileName}:`, error)
    return null
  }
}

