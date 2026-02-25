import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || '/', `https://${req.headers.host}`)
  const originalPath = url.pathname.replace(/^\/vocadb-api/, '') || '/'
  const targetUrl = `https://vocadb.net${originalPath}${url.search}`

  try {
    const response = await fetch(targetUrl, {
      method: req.method || 'GET',
      headers: {
        'User-Agent': 'V-Link/1.0',
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
    console.error('VocaDB proxy error:', error)
    res.status(500).json({ error: 'Proxy request failed' })
  }
}
