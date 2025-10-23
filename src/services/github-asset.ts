import { getGitHubToken } from '../utils/github'
import { USER_AGENT } from '../utils/constants'
import { notFound } from '../utils/response'

/**
 * 获取 GitHub Asset
 */
async function fetchAsset(assetUrl: string): Promise<Response> {
  const token = getGitHubToken()
  const headers: HeadersInit = {
    Accept: 'application/octet-stream',
    'user-agent': USER_AGENT,
  }

  if (token) {
    headers.Authorization = `token ${token}`
  }

  return fetch(assetUrl, { headers })
}

/**
 * 下载 GitHub Asset
 */
export async function downloadGitHubAsset(assetUrl: string, filename: string): Promise<Response> {
  try {
    const response = await fetchAsset(assetUrl)

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
export async function findAssetSignature(fileName: string, assets: any[]): Promise<string | null> {
  const signatureAsset = assets.find(
    asset => asset.name.toLowerCase() === `${fileName.toLowerCase()}.sig`
  )

  if (!signatureAsset) return null

  try {
    const response = await fetchAsset(signatureAsset.url)
    return response.ok ? await response.text() : null
  } catch (error) {
    console.error(`Failed to get signature for ${fileName}:`, error)
    return null
  }
}
