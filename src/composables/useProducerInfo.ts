import { ref, reactive } from 'vue'
import type { Track, Producer } from '@/stores/player'
import {
  getVideoInfo,
  extractProducerNameFromDesc,
  extractIllustratorNameFromDesc,
} from '@/utils/bilibili'
import { searchArtist, getArtistDetails, mapVocaDBArtistToProducer } from '@/utils/vocadb'
import { getPixivUserTopWorks } from '@/utils/pixiv'

// Global cache to prevent duplicate requests across component re-mounts or version switches
// Key: ArtistName, Value: Producer
const producerCache = reactive(new Map<string, Producer>())
// Key: BVID, Value: Object with producerName and illustratorName
const videoCreditsCache = reactive(new Map<string, { producer?: string; illustrator?: string }>())

export function useProducerInfo() {
  const isLoading = ref(false)

  // These refs will be local to the usage, but populated from cache/fetch
  const producerInfo = ref<Producer | null>(null)

  /**
   * Helper to fetch artist info from VocaDB
   */
  async function fetchArtistFromVocaDB(
    name: string,
    artistTypes: string,
  ): Promise<Producer | null> {
    if (producerCache.has(name)) {
      return producerCache.get(name)!
    }

    try {
      const artistResult = await searchArtist(name, artistTypes)
      if (!artistResult) return null

      const details = await getArtistDetails(artistResult.id)
      if (!details) return null

      const producer = mapVocaDBArtistToProducer(details)

      console.log(producer)

      // If illustrator has Pixiv ID, fetch artworks
      if (artistTypes.includes('Illustrator') && producer.pixivId) {
        console.log(
          `[ProducerInfo] Fetching Pixiv artworks for ${producer.name} (${producer.pixivId})`,
        )
        const works = await getPixivUserTopWorks(producer.pixivId)
        if (works.length > 0) {
          producer.topWorks = works
        }
      }

      producerCache.set(name, producer)
      return producer
    } catch (e) {
      console.error(`Error fetching artist ${name}:`, e)
      return null
    }
  }

  /**
   * Fetch producer and illustrator info for a track
   */
  async function fetchProducerInfo(track: Track | null) {
    console.log(track)
    if (!track) {
      producerInfo.value = null
      return
    }

    // Identify unique key for the video source
    // We try to find the BVID from the current version, matching by label or type
    // If not found, we fallback to the first version that has a BVID, or the track ID
    let bvid = ''
    const currentVersionLabel = track.currentVersion

    if (currentVersionLabel && currentVersionLabel !== '无MV') {
      const version = track.versions?.find(
        (v) => v.label === currentVersionLabel || v.type === currentVersionLabel,
      )
      if (version?.bvid) {
        bvid = version.bvid
      }
    }

    // Fallback: use first version with a BVID if still not found
    if (!bvid) {
      bvid = track.versions?.find((v) => v.bvid)?.bvid || ''
    }

    // Secondary Fallback: for non-PJSK songs, the ID might be the BVID
    if (!bvid && !track.is_pjsk && track.id?.startsWith('BV')) {
      bvid = track.id
    }

    if (!bvid || !bvid.startsWith('BV')) {
      return
    }

    // Check if we already have full info
    if (track.producer && track.illustrator) {
      return
    }

    // Check cache for this specific video's credits
    const cachedCredits = videoCreditsCache.get(bvid)

    // If we have cached credits, try to use them to populate track
    if (cachedCredits) {
      if (!track.producer && cachedCredits.producer) {
        track.producer = producerCache.get(cachedCredits.producer)
      }
      if (!track.illustrator && cachedCredits.illustrator) {
        track.illustrator = producerCache.get(cachedCredits.illustrator)
      }

      // If we populated at least one or confirmed we have the info, we can return
      if (track.producer || track.illustrator) {
        return
      }
    }

    // If still missing something, we might need to fetch
    // But if we already cached that "we found nothing", we shouldn't retry?
    // For simplicity, if we have a cache entry for the VIDEO, we assume we processed it.
    if (videoCreditsCache.has(bvid)) {
      return
    }

    isLoading.value = true

    try {
      // 3. Fetch Bilibili Info
      const videoInfo = await getVideoInfo(bvid)
      console.log(videoInfo)
      if (!videoInfo) {
        return
      }

      // 4. Parse Description
      const producerName = extractProducerNameFromDesc(videoInfo.desc, videoInfo.desc_v2)
      const illustratorName = extractIllustratorNameFromDesc(videoInfo.desc)

      console.log(producerName, illustratorName)

      const newCredits: { producer?: string; illustrator?: string } = {}

      // Parallelize Producer and Illustrator info fetching
      const fetchTasks: Promise<void>[] = []

      if (producerName) {
        fetchTasks.push(
          (async () => {
            console.log(`[ProducerInfo] Found producer for ${bvid}: ${producerName}`)
            const producer = await fetchArtistFromVocaDB(producerName, 'Producer')
            if (producer) {
              track.producer = producer
              newCredits.producer = producerName
            }
          })(),
        )
      }

      if (illustratorName) {
        fetchTasks.push(
          (async () => {
            console.log(`[ProducerInfo] Found illustrator for ${bvid}: ${illustratorName}`)
            const illustrator = await fetchArtistFromVocaDB(illustratorName, 'Illustrator,Animator')
            if (illustrator) {
              track.illustrator = illustrator
              newCredits.illustrator = illustratorName
            }
          })(),
        )
      }

      await Promise.all(fetchTasks)

      // Update Cache
      videoCreditsCache.set(bvid, newCredits)
    } catch (error) {
      console.error('[ProducerInfo] Error fetching info:', error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    producerInfo,
    isLoading,
    fetchProducerInfo,
  }
}
