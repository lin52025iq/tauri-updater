import { getLatestRelease } from './release'
import { findAssetSignature } from './asset'
import { json, notFound, noUpdateAvailable } from '../../utils/response'
import { validateUpdateParams, hasNewerVersion } from '../../utils/version-checker'
import { isMatchingAsset } from '../../utils/platform-matcher'
import type { CheckUpdateParams, UpdateResponse } from '../../types'

/**
 * 检查更新
 */
export async function checkUpdate(params: CheckUpdateParams & { rootUrl: string }): Promise<Response> {
  const { username, reponame, platform, version, arch, rootUrl } = params

  // 基础验证
  if (!validateUpdateParams(platform, version)) {
    return notFound()
  }

  // 获取最新发布版本
  const release = await getLatestRelease(username, reponame)
  if (!release) return notFound()

  // 版本比较
  if (!hasNewerVersion(release.tag_name, version)) {
    return noUpdateAvailable()
  }

  // 查找匹配的资产
  const asset = release.assets.find(a => isMatchingAsset(platform, arch, a.name))
  if (!asset) return notFound()

  // 构建响应
  const signature = await findAssetSignature(asset.name, release.assets)
  const result: UpdateResponse = {
    name: release.tag_name,
    notes: release.body,
    pub_date: release.published_at,
    signature,
    url: `${rootUrl}/github/download-asset?asset=${encodeURIComponent(asset.url)}&filename=${encodeURIComponent(asset.name)}`,
  }

  return json(result)
}

