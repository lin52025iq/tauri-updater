import OSS from 'ali-oss'
import type { OssConfig } from '../../types'

/**
 * 从环境变量获取 OSS 配置
 */
export function getOssConfigFromEnv(): OssConfig | null {
  const accessKeyId = process.env.ALIOSS_ACCESSKEYID
  const accessKeySecret = process.env.ALIOSS_ACCESSKEYSECRET
  const endpoint = process.env.ALIOSS_ENDPOINT
  const bucket = process.env.ALIOSS_BUCKET
  const dir = process.env.ALIOSS_DIR

  if (!accessKeyId || !accessKeySecret || !endpoint || !bucket) {
    console.error('[OSS] Missing required OSS environment variables')
    return null
  }

  return {
    access_key_id: accessKeyId,
    access_key_secret: accessKeySecret,
    endpoint,
    bucket,
    dir: dir || '',
  }
}

/**
 * 创建 OSS 客户端
 */
export function createOssClient(config: OssConfig): OSS {
  return new OSS({
    accessKeyId: config.access_key_id,
    accessKeySecret: config.access_key_secret,
    bucket: config.bucket,
    region: config.endpoint.replace('.aliyuncs.com', ''),
    secure: true,
    timeout: 30000
  })
}

/**
 * 构建 OSS 对象路径
 * @param config OSS 配置
 * @param paths 路径片段
 * @returns 完整的对象路径
 */
export function buildOssPath(config: OssConfig, ...paths: string[]): string {
  const joinedPath = paths.filter(Boolean).join('/')
  return config.dir ? `${config.dir}${joinedPath}` : joinedPath
}

/**
 * 使用 OSS SDK 上传文件
 */
export async function uploadToOss(
  config: OssConfig,
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  const client = createOssClient(config)
  
  // 拼接上传路径：dir + fileName
  const objectKey = buildOssPath(config, fileName)

  // 上传 Buffer 到指定路径
  const result = await client.put(objectKey, fileBuffer)

  return result.url
}

