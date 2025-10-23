import { Hono } from 'hono'
import { getLatestRelease, downloadGitHubAsset, checkUpdate } from '../services/github'
import type { Arch } from '../types'

const routename = 'github'

/**
 * GitHub 相关路由
 */
export const githubRoutes = new Hono()

// 获取最新发布版本
githubRoutes.all(`/${routename}/:username/:reponame/latest`, async (c) => {
  const { username, reponame } = c.req.param()
  const release = await getLatestRelease(username, reponame)
  return release ? c.json(release) : c.notFound()
})

// 检查更新
githubRoutes.get(`/${routename}/check/:username/:reponame/:platform/:arch/:version`, async (c) => {
  const url = new URL(c.req.url)
  const params = c.req.param()

  return checkUpdate({
    ...params,
    arch: params.arch as Arch,
    rootUrl: `${url.protocol}//${url.host}`,
  })
})

// 下载资产
githubRoutes.get(`/${routename}/download-asset`, async (c) => {
  const { asset, filename } = c.req.query()
  return (asset && filename)
    ? downloadGitHubAsset(asset, filename)
    : c.notFound()
})
