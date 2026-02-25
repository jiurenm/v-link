import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extract the original path: /bili-api/x/web-interface/view -> /x/web-interface/view
  const url = new URL(req.url || '/', `https://${req.headers.host}`)
  const originalPath = url.pathname.replace(/^\/bili-api/, '') || '/'
  const targetUrl = `https://api.bilibili.com${originalPath}${url.search}`

  try {
    const response = await fetch(targetUrl, {
      method: req.method || 'GET',
      headers: {
        Referer: 'https://www.bilibili.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    // Forward response headers
    response.headers.forEach((value, key) => {
      // Skip headers that Vercel manages
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, value)
      }
    })

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')

    const data = await response.arrayBuffer()
    res.status(response.status).send(Buffer.from(data))
  } catch (error) {
    console.error('Bili API proxy error:', error)
    res.status(500).json({ error: 'Proxy request failed' })
  }
}
