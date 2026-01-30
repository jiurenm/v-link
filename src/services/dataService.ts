import { mapSongsToTracks, type SongFromJSON } from '@/utils/trackMapper'
import type { Track } from '@/stores/player'

const DATABASE_URL =
  'https://raw.githubusercontent.com/jiurenm/v-link-database/refs/heads/main/public/data/database.json'

let cachedTracks: Track[] | null = null

export async function fetchTracks(): Promise<Track[]> {
  if (cachedTracks) {
    return cachedTracks
  }

  try {
    const response = await fetch(DATABASE_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch database: ${response.statusText}`)
    }
    const data = (await response.json()) as SongFromJSON[]
    cachedTracks = mapSongsToTracks(data)
    return cachedTracks
  } catch (error) {
    console.error('Error fetching tracks:', error)
    return []
  }
}
