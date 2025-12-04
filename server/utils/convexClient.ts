import { ConvexHttpClient } from 'convex/browser'

let cachedClient: ConvexHttpClient | null = null

export const getConvexClient = () => {
  if (cachedClient) {
    return cachedClient
  }

  const url =
    process.env.CONVEX_URL ||
    process.env.NUXT_PUBLIC_CONVEX_URL ||
    ''

  if (!url || !/^https?:\/\//.test(url)) {
    console.warn(
      '[convex] Missing or invalid CONVEX_URL. Server endpoints will return 503 until it is set.'
    )
    return null
  }

  try {
    cachedClient = new ConvexHttpClient(url)
  } catch (error) {
    console.error('[convex] Failed to initialise Convex client:', error)
    return null
  }

  return cachedClient
}
