/**
 * Pixiv API utilities
 */
import { getApiBaseUrl } from './electron'

export interface PixivWork {
  id: string
  title: string
  url: string // Proxy URL
}

/**
 * Fetch top works for a Pixiv user
 */
export async function getPixivUserTopWorks(userId: string): Promise<PixivWork[]> {
  try {
    const baseUrl = getApiBaseUrl('/pixiv-api')
    // Pixiv AJAX API for user profile top content
    const response = await fetch(`${baseUrl}/ajax/user/${userId}/profile/top?lang=zh`, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Pixiv API Error: ${response.status}`)
    }

    const data = await response.json()
    if (data.error) {
      console.error('Pixiv API Error:', data.message)
      return []
    }

    // data.body.illusts is an object where keys are illust IDs
    const illusts = data.body.illusts || {}
    const works: PixivWork[] = []

    // Map to our inner format and use i.pixiv.re for proxying images
    for (const id in illusts) {
      const illust = illusts[id]
      works.push({
        id: id,
        title: illust.title,
        // Use i.pixiv.re proxy to bypass referer check
        // Original usually contains s.pximg.net, i.pximg.net or t.pximg.net
        url: (illust.url || '').replace(/[\w-]+\.pximg\.net/, 'i.pixiv.re'),
      })
    }

    // Limit to top 6 works
    return works.slice(0, 6)
  } catch (error) {
    console.error('Pixiv Fetch Error:', error)
    return []
  }
}
