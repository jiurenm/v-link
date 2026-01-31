/**
 * VocaDB API Utilities
 * API Documentation: https://vocadb.net/api
 */

import { getApiBaseUrl } from './electron'
import type { Producer } from '@/stores/player'

// VocaDB Artist Types
export interface VocaDBArtist {
  id: number
  name: string
  defaultName: string
  artistType: string
  mainPicture?: {
    urlTinyThumb?: string
    urlSmallThumb?: string
    urlThumb?: string
    urlOriginal?: string
  }
}

export interface VocaDBArtistDetails extends VocaDBArtist {
  latestSongs?: VocaDBSong[]
  webLinks?: Array<{
    description: string
    url: string
    category: string
    disabled: boolean
  }>
  // ... other fields as needed
}

export interface VocaDBSong {
  id: number
  name: string
  defaultName: string
  mainPicture?: {
    urlThumb?: string
    urlOriginal?: string
  }
}

/**
 * Search for an artist by name
 */
export async function searchArtist(
  query: string,
  artistTypes: string = 'Producer,Illustrator,Animator',
): Promise<VocaDBArtist | null> {
  try {
    const params = new URLSearchParams({
      query,
      maxResults: '3',
      nameMatchMode: 'Auto',
      lang: 'Default',
      preferAccurateMatches: 'true',
      getTotalCount: 'false',
      artistTypes, // Focus on producers and illustrators
    })

    // Determine Base URL
    // In dev: proxy via Vite server (e.g. /vocadb-api/...) or direct if CORS allows?
    // VocaDB supports CORS for GET requests, but let's be safe.
    // If using electron.ts helper:
    const baseUrl = getApiBaseUrl('/vocadb-api')

    // NOTE: The user's mock request used explicit headers.
    // VocaDB usually allows open access but user-agent is nice.
    const headers: HeadersInit = {
      Accept: 'application/json',
    }

    const response = await fetch(`${baseUrl}/api/artists?${params}`, { headers })
    if (!response.ok) {
      // Fallback or retry?
      throw new Error(`VocaDB API Error: ${response.status}`)
    }

    const data = await response.json()
    if (data.items && data.items.length > 0) {
      // Return the first match.
      // Optimally we could filter by ArtistType if we knew what we were looking for (Producer vs Illustrator)
      return data.items[0]
    }
    return null
  } catch (error) {
    console.error('VocaDB Search Error:', error)
    return null
  }
}

/**
 * Get detailed artist info including latest songs
 */
export async function getArtistDetails(id: number): Promise<VocaDBArtistDetails | null> {
  try {
    const baseUrl = getApiBaseUrl('/vocadb-api')
    // We want latest songs, so we might need a separate call or specific includes?
    // The user example used: /api/artists/69511/details
    // The details endpoint returns `latestSongs` by default or we check the response.

    const response = await fetch(`${baseUrl}/api/artists/${id}/details`, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) throw new Error(`VocaDB Detail Error: ${response.status}`)

    const data = await response.json()
    return data as VocaDBArtistDetails
  } catch (error) {
    console.error('VocaDB Details Error:', error)
    return null
  }
}

/**
 * Map VocaDB Artist to our local Producer interface
 */
export function mapVocaDBArtistToProducer(artist: VocaDBArtistDetails): Producer {
  const avatar = artist.mainPicture?.urlThumb || artist.mainPicture?.urlOriginal || ''

  const topSongs =
    artist.latestSongs?.slice(0, 3).map((song) => ({
      id: song.id.toString(),
      title: song.defaultName || song.name,
      cover: song.mainPicture?.urlThumb || song.mainPicture?.urlOriginal || '',
    })) || []

  // Map WebLinks
  // Filter out disabled links
  const links =
    artist.webLinks
      ?.filter((link) => !link.disabled)
      .map((link) => ({
        title: link.description,
        url: link.url,
        category: link.category, // e.g. "Official", "Commercial", "Reference"
      })) || []

  // Extract Pixiv ID from links
  let pixivId: string | undefined
  const pixivLink = links.find((l) => l.url.includes('pixiv.net') || l.url.includes('pixiv.me'))
  if (pixivLink) {
    // Matches /users/123, /en/users/123, member.php?id=123 etc.
    const match = pixivLink.url.match(/(?:users\/|member\.php\?id=)(\d+)/)
    if (match) {
      pixivId = match[1]
    } else {
      // Handle pixiv.me/name format
      const nameMatch = pixivLink.url.match(/pixiv\.me\/([^/]+)/)
      if (nameMatch) pixivId = nameMatch[1]
    }
  }

  return {
    id: artist.id.toString(),
    name: artist.defaultName || artist.name,
    avatar,
    topSongs,
    links,
    pixivId, // Add optional field (need to update interface)
  }
}
