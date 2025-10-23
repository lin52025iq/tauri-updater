import type { Arch, Platform } from './platforms'
import { PLATFORM_RULES, ARCH_RULES } from './platforms'

/**
 * 检查资产文件名是否匹配指定的平台和架构
 * 用于 GitHub Release 资产匹配
 */
export function isMatchingAsset(platform: string, arch: Arch, fileName: string): boolean {
  const lowerName = fileName.toLowerCase()
  const extension = lowerName.split('.').pop() || ''

  // 检查平台匹配
  const platformKeywords = PLATFORM_RULES[platform as Platform]
  if (!platformKeywords?.some(keyword => lowerName.includes(keyword))) {
    return false
  }

  // 检查架构匹配
  const archKeys = ARCH_RULES[arch] || []
  return archKeys.some(keyword => lowerName.includes(keyword)) || 
         (['darwin', 'linux'].includes(platform) && extension === 'gz')
}

/**
 * 检查平台键是否匹配指定的平台和架构
 * 用于 Tauri Update Manifest 平台键匹配
 */
export function isMatchingPlatformKey(platform: string, arch: Arch, platformKey: string): boolean {
  const lowerKey = platformKey.toLowerCase()

  // 检查平台匹配
  const platformKeywords = PLATFORM_RULES[platform as Platform]
  if (!platformKeywords?.some(keyword => lowerKey.includes(keyword))) {
    return false
  }

  // 检查架构匹配
  const archKeys = ARCH_RULES[arch] || []
  return archKeys.some(keyword => lowerKey.includes(keyword))
}

/**
 * 从 manifest.platforms 中查找匹配的平台键
 */
export function findMatchingPlatform(
  platforms: Record<string, any>,
  platform: string,
  arch: Arch
): string | null {
  for (const platformKey in platforms) {
    if (isMatchingPlatformKey(platform, arch, platformKey)) {
      return platformKey
    }
  }
  return null
}

