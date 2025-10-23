import { getGitHubToken } from '../utils/github'
import { USER_AGENT } from '../utils/constants'
import type { GitHubRelease } from '../types'

/**
 * 获取最新发布版本
 */
export async function getLatestRelease(username: string, reponame: string): Promise<GitHubRelease | null> {
  const url = `https://api.github.com/repos/${username}/${reponame}/releases/latest`
  const token = getGitHubToken()

  const headers: HeadersInit = {
    Accept: 'application/vnd.github.preview',
    'user-agent': USER_AGENT,
  }

  if (token) {
    headers.Authorization = `token ${token}`
  }

  try {
    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.error(`Failed to fetch release: ${response.status}`)
      return null
    }

    return await response.json() as GitHubRelease
  } catch (error) {
    console.error('Error fetching latest release:', error)
    return null
  }
}
