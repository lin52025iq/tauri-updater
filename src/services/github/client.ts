/**
 * 用户代理字符串（用于 GitHub API 请求）
 */
export const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

/**
 * 获取 GitHub Token
 */
export const getGitHubToken = (): string => {
  return process.env.GITHUB_TOKEN || ''
}

