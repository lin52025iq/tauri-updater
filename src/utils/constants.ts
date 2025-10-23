/**
 * 用户代理字符串
 */
export const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

/**
 * 支持的平台
 */
export const AVAILABLE_PLATFORMS = {
  MacOS: 'darwin',
  Windows: 'windows',
  Linux: 'linux'
} as const

/**
 * 平台验证
 */
export const validatePlatform = (platform: string): boolean => {
  return Object.values(AVAILABLE_PLATFORMS).includes(platform as any)
}
