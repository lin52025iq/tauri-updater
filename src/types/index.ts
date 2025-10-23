/**
 * 类型定义统一导出
 */

// 从 utils/platforms 重新导出平台相关类型
import type { Arch, Platform } from '../utils/platforms'
export type { Arch, Platform }

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

// OSS 配置类型
export interface OssStsConfig {
  dir: string
  host: string
  policy: string
  security_token: string
  signature: string
  x_oss_credential: string
  x_oss_date: string
  x_oss_signature_version: string
}

export interface OssConfig {
  access_key_id: string
  access_key_secret: string
  endpoint: string
  bucket: string
  dir?: string // 上传目录前缀，例如: "releases/" 或 "releases/v1.0/"
}

export type OssUploadConfig = OssStsConfig | OssConfig

// OSS 上传请求参数
export interface OssUploadParams {
  username: string
  reponame: string
  ossConfig: OssUploadConfig
  uploadType: 'sts' | 'normal'
}

// Tauri 更新 JSON 格式
export interface TauriUpdateManifest {
  version: string
  notes: string
  pub_date: string
  platforms: {
    [key: string]: {
      signature: string
      url: string
    }
  }
}
