import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || '/', `https://${req.headers.host}`)
  const originalPath = url.pathname.replace(/^\/pixiv-api/, '') || '/'
  const targetUrl = `https://www.pixiv.net${originalPath}${url.search}`

  try {
    const response = await fetch(targetUrl, {
      method: req.method || 'GET',
      headers: {
        Referer: 'https://www.pixiv.net',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, value)
      }
    })

    res.setHeader('Access-Control-Allow-Origin', '*')

    const data = await response.arrayBuffer()
    res.status(response.status).send(Buffer.from(data))
  } catch (error) {
    console.error('Pixiv proxy error:', error)
    res.status(500).json({ error: 'Proxy request failed' })
  }
}
