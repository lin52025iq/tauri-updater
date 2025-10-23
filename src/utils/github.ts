/**
 * 获取 GitHub Token
 */
export const getGitHubToken = (): string => {
  return process.env.GITHUB_TOKEN || ''
}

/**
 * 清理版本号，移除 'v' 前缀
 */
export const sanitizeVersion = (version: string): string => {
  return version.startsWith('v') ? version.slice(1) : version
}
