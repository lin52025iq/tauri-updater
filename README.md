# Tauri Updater Server

一个基于 Hono 构建的 Tauri 应用更新服务器，提供 GitHub Releases 的更新检查、版本管理和资源下载功能。

## ✨ 特性

- 🚀 **自动更新检查** - 基于 GitHub Releases 自动检查应用更新
- 📦 **多平台支持** - 支持 macOS、Windows 和 Linux 平台
- 🔧 **多架构支持** - 支持 x86_64、i686、aarch64 和 armv7 架构
- 🔐 **签名验证** - 自动查找并返回资源签名文件
- 📊 **版本比较** - 基于 semver 的精确版本比较
- ⚡ **高性能** - 使用 Hono 框架，轻量级且高效
- 🔒 **GitHub Token 支持** - 支持私有仓库和提高 API 限制

## 📋 目录

- [快速开始](#快速开始)
  - [环境要求](#环境要求)
  - [安装依赖](#安装依赖)
- [配置](#配置)
- [API 文档](#api-文档)
- [使用示例](#使用示例)
- [部署](#部署)
- [技术栈](#技术栈)

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **pnpm** (包管理器)

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

在项目根目录创建 `.env` 文件：

```env
# 服务器端口（可选，默认 3000）
PORT=3000

# GitHub Token（可选，用于提高 API 限制或访问私有仓库）
GITHUB_TOKEN=ghp_your_github_token_here
```

### 获取 GitHub Token

1. 访问 [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 给 token 一个描述性名称
4. 选择以下权限：
   - `public_repo` - 访问公开仓库（私有仓库需要 `repo` 权限）
   - `contents` - 读取仓库内容和下载资源
5. 生成并复制 token 到 `.env` 文件

## 📚 API 文档

### 1. 健康检查

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

### 2. 获取最新版本

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

---

### 3. 检查更新

检查是否有新版本可用。

**端点：** `GET /check/:username/:reponame/:platform/:arch/:version`

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

**响应示例（无更新）：**
```json
{
  "message": "No update available"
}
```

**状态码：**
- `200` - 有更新可用或无更新
- `204` - 无更新可用
- `404` - 未找到匹配的资源或版本

---

### 4. 下载资源

下载 GitHub Release 资源文件。

> **说明：** 此接口通常不需要手动调用。下载链接会在调用"检查更新"接口时自动返回在响应的 `url` 字段中。Tauri 应用会自动使用该链接下载更新文件。

**端点：** `GET /github/download-asset`

**查询参数：**
- `asset` - 资源 URL（需要 URL 编码）
- `filename` - 文件名

**响应：** 文件流，带 `Content-Disposition` 头部

**使用流程：**
1. 调用"检查更新"接口获取更新信息
2. 从响应中获取 `url` 字段（已包含完整的下载链接）
3. 使用该 URL 下载资源文件（Tauri 会自动处理）

## 💡 使用示例

### 在 Tauri 应用中使用

在 `tauri.conf.json` 中配置：

```json
{
  "updater": {
    "active": true,
    "endpoints": [
      "http://your-server.com/check/username/reponame/{{target}}/{{arch}}/{{current_version}}"
    ],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}
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
# 检查更新
curl http://localhost:3000/check/tauri-apps/tauri/darwin/x86_64/1.0.0

# 获取最新版本
curl http://localhost:3000/github/tauri-apps/tauri/latest

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
docker run -p 3000:3000 -e GITHUB_TOKEN=your_token tauri-updater
```

### 使用 PM2

#### 安装 PM2

```bash
# 全局安装 PM2
npm install -g pm2
```

#### 使用配置文件部署

项目已包含 `pm2.config.json` 配置文件，提供了完整的 PM2 配置选项。

```bash
# 构建项目
pnpm build

# 使用配置文件启动服务
pnpm pm2:start

# 或者直接使用 PM2 命令
pm2 start pm2.config.json
```


#### PM2 配置说明

`pm2.config.json` 配置文件包含以下特性：

- **自动重启**: 应用崩溃时自动重启
- **内存限制**: 内存使用超过 1GB 时自动重启

#### 设置开机自启

```bash
# 生成启动脚本
pm2 startup

# 保存当前 PM2 进程列表
pm2 save
```


## 🔧 技术栈

- **[Hono](https://hono.dev/)** - 轻量级 Web 框架
- **[TypeScript](https://www.typescriptlang.org/)** - 类型安全的 JavaScript
- **[semver](https://github.com/npm/node-semver)** - 语义化版本管理
- **[tsup](https://tsup.egoist.dev/)** - TypeScript 打包工具
- **[dotenv](https://github.com/motdotla/dotenv)** - 环境变量管理

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

## 📝 许可证

本项目采用 [MIT License](./LICENSE) 开源协议。

---

**注意事项：**
- 确保 GitHub Release 的资源文件命名符合规范
- 建议使用 GitHub Token 以避免 API 限制
- 生产环境请使用 HTTPS
- 定期更新依赖包以确保安全性
