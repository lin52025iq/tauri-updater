/**
 * 返回 JSON 响应
 */
export const json = (data: any, status: number = 200): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * 返回 404 响应
 */
export const notFound = (): Response => {
  return new Response('Not Found', { status: 404 })
}

/**
 * 返回无更新可用响应
 */
export const noUpdateAvailable = (): Response => {
  return new Response(null, { status: 204 })
}
