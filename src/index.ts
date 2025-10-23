import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { githubRoutes } from './routes/github.routes'
import { aliossRoutes } from './routes/alioss.routes'

/**
 * 创建应用实例
 */
const app = new Hono()

// 全局中间件
app.use('/*', cors())

// 请求日志中间件
app.use(async (c, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(`${c.req.method} ${c.req.path} - ${ms}ms`)
})

// 健康检查路由
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 注册路由
app.route('/', githubRoutes)
app.route('/', aliossRoutes)

/**
 * 启动服务器
 */
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  console.log(`🚀 Server is running on http://localhost:${info.port}`)
  console.log(`📊 Health check: http://localhost:${info.port}/health`)
})
