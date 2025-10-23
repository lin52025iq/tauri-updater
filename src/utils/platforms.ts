/**
 * 平台和架构相关的类型定义、常量和验证函数
 */

/**
 * 架构类型
 */
export type Arch = 'i686' | 'x86_64' | 'armv7' | 'aarch64'

/**
 * 平台类型
 */
export type Platform = 'darwin' | 'windows' | 'linux'

/**
 * 支持的平台映射
 */
export const AVAILABLE_PLATFORMS = {
  MacOS: 'darwin',
  Windows: 'windows',
  Linux: 'linux'
} as const

/**
 * 平台匹配关键词规则
 * 用于识别文件名或平台键中的平台信息
 */
export const PLATFORM_RULES: Record<Platform, string[]> = {
  darwin: ['.app', 'darwin', 'macos', 'osx', 'apple'],
  windows: ['win64', 'win32', 'windows', '.msi', '.nsis', '.exe', 'win', 'pc'],
  linux: ['appimage', 'linux', 'ubuntu', 'debian']
}

/**
 * 架构匹配关键词规则
 * 用于识别文件名或平台键中的架构信息
 */
export const ARCH_RULES: Record<Arch, string[]> = {
  'aarch64': ['aarch64', 'arm64', 'universal'],
  'armv7': ['armv7', 'arm64', 'universal'],
  'x86_64': ['x64', 'amd64', 'win64', 'x86_64', 'universal'],
  'i686': ['i686', 'win32', 'x32', 'i386']
}

/**
 * 验证平台字符串是否有效
 */
export function validatePlatform(platform: string): boolean {
  return Object.values(AVAILABLE_PLATFORMS).includes(platform as any)
}

