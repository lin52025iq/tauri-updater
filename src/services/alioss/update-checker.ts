import type { Arch, UpdateResponse } from '../../types'
import { json, notFound, noUpdateAvailable } from '../../utils/response'
import { validateUpdateParams, hasNewerVersion } from '../../utils/version-checker'
import { findMatchingPlatform } from '../../utils/platform-matcher'
import { getLatestReleaseFromOss } from './release'

/**
 * 从 OSS 检查更新
 */
export async function checkUpdateFromOss(params: {
  username: string
  reponame: string
  platform: string
  arch: Arch
  version: string
}): Promise<Response> {
  const { username, reponame, platform, version, arch } = params

  // 基础验证
  if (!validateUpdateParams(platform, version)) {
    return notFound()
  }

  // 从 OSS 获取最新发布版本
  const manifest = await getLatestReleaseFromOss(username, reponame)
  if (!manifest) {
    return notFound()
  }

  // 版本比较
  if (!hasNewerVersion(manifest.version, version)) {
    return noUpdateAvailable()
  }

  // 查找匹配的平台
  const matchedPlatform = findMatchingPlatform(manifest.platforms, platform, arch)

  if (!matchedPlatform) {
    console.log(`[OSS] No matching platform found for ${platform}-${arch}`)
    console.log(`[OSS] Available platforms:`, Object.keys(manifest.platforms))
    return notFound()
  }

  const platformData = manifest.platforms[matchedPlatform]

  // 构建响应
  const result: UpdateResponse = {
    name: manifest.version,
    notes: manifest.notes,
    pub_date: manifest.pub_date,
    signature: platformData.signature,
    url: platformData.url,
  }

  return json(result)
}

