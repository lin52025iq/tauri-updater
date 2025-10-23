import semver from 'semver'
import { getLatestRelease } from './github-release'
import { findAssetSignature } from './github-asset'
import { json, notFound, noUpdateAvailable } from '../utils/response'
import { validatePlatform } from '../utils/constants'
import { sanitizeVersion } from '../utils/github'
import type { CheckUpdateParams, UpdateResponse, Arch } from '../types'

/**
 * 检查资产是否匹配平台和架构
 */
function isMatchingAsset(platform: string, arch: Arch, fileName: string): boolean {
  const lowerName = fileName.toLowerCase()
  const extension = lowerName.split('.').pop() || ''

  // 平台匹配规则
  const platformRules = {
    darwin: ['.app', 'darwin', 'osx'],
    windows: ['win64', 'win32', 'windows', '.msi', '.nsis', '.exe'],
    linux: ['appimage']
  }

  // 检查平台匹配
  const platformKeywords = platformRules[platform as keyof typeof platformRules]
  if (!platformKeywords?.some(keyword => lowerName.includes(keyword))) {
    return false
  }

  // 架构匹配
  const archKeywords = {
    'aarch64': ['aarch64', 'arm64', 'universal'],
    'armv7': ['armv7', 'arm64', 'universal'],
    'x86_64': ['x64', 'amd64', 'win64', 'universal'],
    'i686': ['i686', 'win32', 'x32']
  }

  const archKeys = archKeywords[arch] || []
  return archKeys.some(keyword => lowerName.includes(keyword)) || (['darwin', 'linux'].includes(platform) && extension === 'gz')
}

/**
 * 检查更新
 */
export async function checkUpdate(params: CheckUpdateParams & { rootUrl: string }): Promise<Response> {
  const { username, reponame, platform, version, arch, rootUrl } = params

  // 基础验证
  if (!validatePlatform(platform) || !semver.valid(version)) {
    return notFound()
  }

  // 获取最新发布版本
  const release = await getLatestRelease(username, reponame)
  if (!release) return notFound()

  // 版本比较
  const remoteVersion = sanitizeVersion(release.tag_name.toLowerCase())
  if (!semver.valid(remoteVersion) || !semver.gt(remoteVersion, version)) {
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
