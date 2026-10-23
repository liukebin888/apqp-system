export const configuration = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'apqp-jwt-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
    useSsl: process.env.MINIO_USE_SSL === 'true',
  },
})

export const validate = (config: Record<string, unknown>) => {
  const errors: string[] = []
  if (!config.DATABASE_URL) {
    errors.push('DATABASE_URL is required')
  }
  if (errors.length > 0) {
    throw new Error(`Config validation failed: ${errors.join(', ')}`)
  }
  return config
}
