import semver from 'semver'
import { validatePlatform } from './platforms'

/**
 * 清理版本号，移除 'v' 前缀
 */
export function sanitizeVersion(version: string): string {
  return version.startsWith('v') ? version.slice(1) : version
}

/**
 * 验证更新检查的基础参数
 */
export function validateUpdateParams(platform: string, version: string): boolean {
  return validatePlatform(platform) && !!semver.valid(version)
}

/**
 * 比较版本，检查远程版本是否大于当前版本
 * @param remoteVersion 远程版本号（可能需要清理）
 * @param currentVersion 当前版本号
 * @returns 如果远程版本更新则返回 true
 */
export function hasNewerVersion(remoteVersion: string, currentVersion: string): boolean {
  const cleanRemoteVersion = sanitizeVersion(remoteVersion.toLowerCase())
  
  if (!semver.valid(cleanRemoteVersion)) {
    return false
  }
  
  return semver.gt(cleanRemoteVersion, currentVersion)
}

/**
 * 获取清理后的有效版本号
 * @param version 原始版本号
 * @returns 清理后的版本号，如果无效则返回 null
 */
export function getValidVersion(version: string): string | null {
  const cleanVersion = sanitizeVersion(version.toLowerCase())
  return semver.valid(cleanVersion)
}

