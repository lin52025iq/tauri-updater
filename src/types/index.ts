// 架构类型定义
export type Arch = 'i686' | 'x86_64' | 'armv7' | 'aarch64'

// 平台类型定义
export type Platform = 'darwin' | 'windows' | 'linux'

// GitHub Release 相关类型
export interface GitHubRelease {
  tag_name: string
  name: string
  body: string
  published_at: string
  assets: GitHubAsset[]
  url: string
}

export interface GitHubAsset {
  name: string
  url: string
  size: number
  download_count: number
}

// 更新检查响应类型
export interface UpdateResponse {
  name: string
  notes: string
  pub_date: string
  signature: string | null
  url: string
}

// 路由参数类型
export interface CheckUpdateParams {
  username: string
  reponame: string
  platform: string
  arch: Arch
  version: string
}

export interface LatestReleaseParams {
  username: string
  reponame: string
}
