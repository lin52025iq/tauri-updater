# Tauri Updater Server

一个基于 Hono 构建的 Tauri 应用更新服务器，提供 GitHub Releases 和阿里云 OSS 的更新检查、版本管理和资源下载功能。

## ✨ 特性

### 核心功能
- 🚀 **自动更新检查** - 基于 GitHub Releases 或阿里云 OSS 自动检查应用更新
- 📦 **多平台支持** - 支持 macOS、Windows 和 Linux 平台
- 🔧 **多架构支持** - 支持 x86_64、i686、aarch64 和 armv7 架构
- 🔐 **签名验证** - 自动查找并返回资源签名文件
- 📊 **版本比较** - 基于 semver 的精确版本比较

### 双源更新支持
- 🐙 **GitHub 源** - 直接从 GitHub Releases 获取更新
- ☁️ **阿里云 OSS 源** - 从阿里云 OSS 获取更新（国内访问更快）
- 🔄 **资源同步** - 自动将 GitHub Release 资源上传到阿里云 OSS

### 技术特性
- ⚡ **高性能** - 使用 Hono 框架，轻量级且高效
- 🔒 **GitHub Token 支持** - 支持私有仓库和提高 API 限制
- 🛡️ **优雅的错误处理** - 无异常抛出，通过返回值处理错误
- 📁 **清晰的代码结构** - 模块化设计，易于维护和扩展

## 📋 目录

- [快速开始](#-快速开始)
  - [环境要求](#环境要求)
  - [安装依赖](#安装依赖)
  - [配置](#-配置)
- [API 文档](#-api-文档)
  - [GitHub 源 API](#github-源-api)
  - [阿里云 OSS 源 API](#阿里云-oss-源-api)
- [使用示例](#-使用示例)
- [部署](#-部署)
- [技术栈](#-技术栈)

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 9.0.0

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

服务器将在 `http://localhost:3000` 启动。

### 构建生产版本

```bash
pnpm build
```

### 运行生产版本

```bash
pnpm start
```

## ⚙️ 配置

### 1. 创建环境变量文件

复制 `.env.example` 为 `.env` 并配置相应的环境变量：

```bash
cp .env.example .env
```

### 2. 基础配置

```env
# 服务器端口（可选，默认 3000）
PORT=3000

# GitHub Token（可选，用于提高 API 限制或访问私有仓库）
GITHUB_TOKEN=ghp_your_github_token_here
```

### 3. 阿里云 OSS 配置（可选）

如果需要使用阿里云 OSS 作为更新源，需要配置以下环境变量：

```env
# 访问密钥 ID
ALIOSS_ACCESSKEYID=your_access_key_id

# 访问密钥 Secret
ALIOSS_ACCESSKEYSECRET=your_access_key_secret

# OSS 地域节点（如：oss-cn-hangzhou）
ALIOSS_ENDPOINT=oss-cn-hangzhou

# OSS Bucket 名称
ALIOSS_BUCKET=your_bucket_name

# OSS 上传目录前缀（可选，例如：releases/）
ALIOSS_DIR=
```

### 获取 GitHub Token

1. 访问 [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 给 token 一个描述性名称
4. 选择以下权限：
   - `public_repo` - 访问公开仓库
   - `contents` - 读取仓库内容和下载资源
   - `repo` - 访问私有仓库（如需要）
5. 生成并复制 token 到 `.env` 文件

### 获取阿里云 OSS 密钥

1. 登录 [阿里云控制台](https://ram.console.aliyun.com/)
2. 创建 AccessKey ID 和 AccessKey Secret
3. 创建 OSS Bucket 并记录 Bucket 名称和地域节点
4. 将信息填入 `.env` 文件

## 📚 API 文档

### 健康检查

检查服务器是否正常运行。

**端点：** `GET /health`

**响应示例：**
```json
{
  "status": "ok",
  "timestamp": "2025-10-23T10:30:00.000Z"
}
```

---

## GitHub 源 API

### 1. 获取最新版本

获取 GitHub 仓库的最新发布版本信息。

**端点：** `GET|POST /github/:username/:reponame/latest`

**参数：**
- `username` - GitHub 用户名或组织名
- `reponame` - 仓库名称

**响应示例：**
```json
{
  "tag_name": "v1.2.0",
  "name": "Release v1.2.0",
  "body": "## 更新内容\n- 新增功能 A\n- 修复 Bug B",
  "published_at": "2025-10-23T10:00:00Z",
  "url": "https://github.com/username/repo/releases/tag/v1.2.0",
  "assets": [
    {
      "name": "app-x86_64.app.tar.gz",
      "url": "https://api.github.com/repos/username/repo/releases/assets/123456",
      "size": 12345678,
      "download_count": 100
    }
  ]
}
```

### 2. 检查更新（GitHub 源）

检查是否有新版本可用。

**端点：** `GET /github/check/:username/:reponame/:platform/:arch/:version`

**参数：**
- `username` - GitHub 用户名或组织名
- `reponame` - 仓库名称
- `platform` - 平台类型：`darwin` | `windows` | `linux`
- `arch` - 架构类型：`x86_64` | `i686` | `aarch64` | `armv7`
- `version` - 当前应用版本（遵循 semver 格式，如 `1.0.0`）

**响应示例（有更新）：**
```json
{
  "name": "v1.2.0",
  "notes": "## 更新内容\n- 新增功能 A\n- 修复 Bug B",
  "pub_date": "2025-10-23T10:00:00Z",
  "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXk=",
  "url": "http://localhost:3000/github/download-asset?asset=https%3A%2F%2Fapi.github.com%2Frepos%2Fusername%2Frepo%2Freleases%2Fassets%2F123456&filename=app-x86_64.app.tar.gz"
}
```

**状态码：**
- `200` - 有更新可用
- `204` - 无更新可用
- `404` - 未找到匹配的资源

### 3. 下载资源（GitHub 源）

下载 GitHub Release 资源文件。

> **说明：** 此接口通常不需要手动调用。下载链接会在调用"检查更新"接口时自动返回在响应的 `url` 字段中。Tauri 应用会自动使用该链接下载更新文件。

**端点：** `GET /github/download-asset`

**查询参数：**
- `asset` - 资源 URL（需要 URL 编码）
- `filename` - 文件名

**响应：** 文件流，带 `Content-Disposition` 头部

---

## 阿里云 OSS 源 API

### 1. 获取最新版本（OSS 源）

从阿里云 OSS 获取最新发布版本信息。

**端点：** `GET|POST /alioss/:username/:reponame/latest`

**参数：**
- `username` - 项目用户名或组织名
- `reponame` - 项目名称

**响应示例：**
```json
{
  "version": "1.2.0",
  "notes": "## 更新内容\n- 新增功能 A\n- 修复 Bug B",
  "pub_date": "2025-10-23T10:00:00Z",
  "platforms": {
    "darwin-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/username/reponame/v1.2.0/app-x86_64.app.tar.gz"
    },
    "darwin-aarch64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/username/reponame/v1.2.0/app-aarch64.app.tar.gz"
    }
  }
}
```

### 2. 检查更新（OSS 源）

从阿里云 OSS 检查是否有新版本可用。

**端点：** `GET /alioss/check/:username/:reponame/:platform/:arch/:version`

**参数：**
- `username` - 项目用户名或组织名
- `reponame` - 项目名称
- `platform` - 平台类型：`darwin` | `windows` | `linux`
- `arch` - 架构类型：`x86_64` | `i686` | `aarch64` | `armv7`
- `version` - 当前应用版本

**响应示例（有更新）：**
```json
{
  "name": "1.2.0",
  "notes": "## 更新内容\n- 新增功能 A",
  "pub_date": "2025-10-23T10:00:00Z",
  "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
  "url": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/username/reponame/v1.2.0/app-x86_64.app.tar.gz"
}
```

### 3. 上传资源到 OSS

将 GitHub Release 资源自动上传到阿里云 OSS。

**端点：** `GET /alioss/:username/:reponame/upload`

**参数：**
- `username` - GitHub 用户名或组织名
- `reponame` - 仓库名称

**功能说明：**
1. 自动从 GitHub 获取最新的 Release
2. 下载 Release 中的所有资源文件和签名文件
3. 上传到阿里云 OSS（`username/reponame/tag_name/` 目录）
4. 同时上传一份 `latest.json` 到 `username/reponame/` 目录作为最新版本引用
5. 自动更新 `latest.json` 中的 URL 为 OSS 地址

**响应示例：**
```json
{
  "success": true,
  "latest_json_url": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/username/reponame/latest.json",
  "latest_json": {
    "version": "1.2.0",
    "notes": "## 更新内容",
    "pub_date": "2025-10-23T10:00:00Z",
    "platforms": { ... }
  },
  "uploaded_files": [
    {
      "name": "app-x86_64.app.tar.gz",
      "url": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/...",
      "size": 12345678
    }
  ]
}
```

## 💡 使用示例

### 在 Tauri 应用中使用

#### 方式 1：使用 GitHub 源

在 `tauri.conf.json` 中配置：

```json
{
  "updater": {
    "active": true,
    "endpoints": [
      "http://your-server.com/github/check/username/reponame/{{target}}/{{arch}}/{{current_version}}"
    ],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}
```

#### 方式 2：使用阿里云 OSS 源（推荐国内用户）

```json
{
  "updater": {
    "active": true,
    "endpoints": [
      "http://your-server.com/alioss/check/username/reponame/{{target}}/{{arch}}/{{current_version}}"
    ],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}
```

### OSS 更新工作流程

#### 1. 自动同步（推荐）

在 GitHub Actions 中自动上传到 OSS：

```yaml
name: Release

on:
  release:
    types: [published]

jobs:
  sync-to-oss:
    runs-on: ubuntu-latest
    steps:
      - name: Sync to OSS
        run: |
          curl "https://your-server.com/alioss/${{ github.repository_owner }}/${{ github.event.repository.name }}/upload"
```

#### 2. 手动同步

```bash
# 同步最新 Release 到 OSS
curl http://your-server.com/alioss/username/reponame/upload
```

### 平台和架构映射

| Tauri Target | Platform | Arch |
|--------------|----------|------|
| `x86_64-apple-darwin` | `darwin` | `x86_64` |
| `aarch64-apple-darwin` | `darwin` | `aarch64` |
| `x86_64-pc-windows-msvc` | `windows` | `x86_64` |
| `i686-pc-windows-msvc` | `windows` | `i686` |
| `x86_64-unknown-linux-gnu` | `linux` | `x86_64` |
| `aarch64-unknown-linux-gnu` | `linux` | `aarch64` |

### 资源文件命名规范

为了让服务器正确识别平台和架构，请按照以下规范命名你的 Release 资源：

#### macOS
- `app-name-x86_64.app.tar.gz` - Intel 芯片
- `app-name-aarch64.app.tar.gz` - Apple Silicon
- `app-name-universal.app.tar.gz` - 通用版本

#### Windows
- `app-name-x86_64.msi` 或 `app-name-win64.exe` - 64位
- `app-name-i686.msi` 或 `app-name-win32.exe` - 32位

#### Linux
- `app-name-x86_64.AppImage` - 64位
- `app-name-aarch64.AppImage` - ARM64

#### 签名文件
签名文件应该与资源文件同名，并添加 `.sig` 后缀：
- `app-name-x86_64.app.tar.gz.sig`
- `app-name-x86_64.msi.sig`

### cURL 示例

```bash
# 检查更新（GitHub 源）
curl http://localhost:3000/github/check/tauri-apps/tauri/darwin/x86_64/1.0.0

# 检查更新（OSS 源）
curl http://localhost:3000/alioss/check/tauri-apps/tauri/darwin/x86_64/1.0.0

# 获取最新版本（GitHub）
curl http://localhost:3000/github/tauri-apps/tauri/latest

# 获取最新版本（OSS）
curl http://localhost:3000/alioss/tauri-apps/tauri/latest

# 上传到 OSS
curl http://localhost:3000/alioss/tauri-apps/tauri/upload

# 健康检查
curl http://localhost:3000/health
```

## 🚀 部署

### 使用 Docker

创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源码并构建
COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

构建和运行：

```bash
docker build -t tauri-updater .
docker run -p 3000:3000 \
  -e GITHUB_TOKEN=your_token \
  -e ALIOSS_ACCESSKEYID=your_key_id \
  -e ALIOSS_ACCESSKEYSECRET=your_key_secret \
  -e ALIOSS_ENDPOINT=oss-cn-hangzhou \
  -e ALIOSS_BUCKET=your_bucket \
  tauri-updater
```

### 使用 PM2

#### 安装 PM2

```bash
npm install -g pm2
```

#### 使用配置文件部署

```bash
# 构建项目
pnpm build

# 启动服务
pnpm pm2:start

# 停止服务
pnpm pm2:stop

# 重启服务
pnpm pm2:restart
```

#### 设置开机自启

```bash
# 生成启动脚本
pm2 startup

# 保存当前进程列表
pm2 save
```

## 🔧 技术栈

- **[Hono](https://hono.dev/)** - 轻量级 Web 框架
- **[TypeScript](https://www.typescriptlang.org/)** - 类型安全的 JavaScript
- **[ali-oss](https://github.com/ali-sdk/ali-oss)** - 阿里云 OSS SDK
- **[semver](https://github.com/npm/node-semver)** - 语义化版本管理
- **[tsup](https://tsup.egoist.dev/)** - TypeScript 打包工具
- **[dotenv](https://github.com/motdotla/dotenv)** - 环境变量管理

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

## 📝 许可证

本项目采用 [MIT License](./LICENSE) 开源协议。

---

## 💡 最佳实践

### GitHub 源 vs OSS 源选择

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 国内用户 | OSS 源 | 下载速度快，稳定性好 |
| 国外用户 | GitHub 源 | 直接访问，无需额外配置 |
| 私有部署 | OSS 源 | 减少 GitHub API 限制 |
| 开源项目 | 两者都支持 | 灵活切换 |

### 安全建议

- ✅ 生产环境请使用 HTTPS
- ✅ 妥善保管 GitHub Token 和 OSS 密钥
- ✅ 定期更新依赖包以确保安全性
- ✅ 配置 OSS 的访问控制策略
- ✅ 使用 Tauri 签名验证确保更新包的完整性

### 性能优化

- ✅ 使用 CDN 加速 OSS 访问
- ✅ 配置合理的 OSS 缓存策略
- ✅ 使用 PM2 集群模式提高并发能力
- ✅ 定期清理 OSS 中的旧版本文件

---

**注意事项：**
- 确保 GitHub Release 的资源文件命名符合规范
- 建议使用 GitHub Token 以避免 API 限制
- OSS 配置为可选，不配置仅影响 OSS 相关功能
- 上传到 OSS 需要先配置好阿里云 OSS 环境变量
