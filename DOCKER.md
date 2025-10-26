# Docker 部署指南

## 快速开始

### 1. 环境准备

确保你的系统已安装：
- Docker
- Docker Compose

### 2. 配置环境变量

复制环境变量示例文件：
```bash
cp env.example .env
```

编辑 `.env` 文件，填入你的实际配置：
- GitHub Token 和相关仓库信息
- 阿里云 OSS 的访问密钥和配置

### 3. 构建和运行

使用 Docker Compose 一键启动：
```bash
# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 4. 验证部署

访问健康检查端点：
```bash
curl http://localhost:3000/health
```

## 常用命令

```bash
# 重新构建镜像
docker-compose build --no-cache

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 进入容器
docker-compose exec tauri-updater sh

# 查看实时日志
docker-compose logs -f tauri-updater
```

## 配置说明

### 端口映射
- 容器内端口：3000
- 宿主机端口：3000（可在 docker-compose.yml 中修改）

### 健康检查
服务包含健康检查机制，每30秒检查一次服务状态。

### 数据持久化
日志文件会挂载到 `./logs` 目录，确保容器重启后日志不丢失。

## 故障排除

1. **端口冲突**：如果3000端口被占用，修改 docker-compose.yml 中的端口映射
2. **权限问题**：确保 Docker 有足够权限访问项目目录
3. **环境变量**：检查 .env 文件是否正确配置
4. **网络问题**：确保容器能访问外部网络（GitHub API、阿里云 OSS）

## 生产环境建议

1. 使用 Docker Secrets 管理敏感信息
2. 配置日志轮转
3. 设置资源限制
4. 使用 HTTPS 代理（如 Nginx）
5. 定期备份重要数据
