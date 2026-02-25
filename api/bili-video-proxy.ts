import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extract dynamic host and path: /bili-video/HOST/path -> https://HOST/path
  const url = new URL(req.url || '/', `https://${req.headers.host}`)
  const match = url.pathname.match(/^\/bili-video\/([^/]+)(.*)$/)

  if (!match) {
    return res.status(400).json({ error: 'Invalid bili-video proxy URL' })
  }

  const targetHost = match[1]
  const targetPath = match[2] || '/'
  const targetUrl = `https://${targetHost}${targetPath}${url.search}`

  try {
    const response = await fetch(targetUrl, {
      method: req.method || 'GET',
      headers: {
        Referer: 'https://www.bilibili.com',
        Origin: 'https://www.bilibili.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    // Forward response headers
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, value)
      }
    })

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')

    const data = await response.arrayBuffer()
    res.status(response.status).send(Buffer.from(data))
  } catch (error) {
    console.error('Bili video proxy error:', error)
    res.status(500).json({ error: 'Proxy request failed' })
  }
}
