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
    if (!track) {
      producerInfo.value = null
      return
    }

    // Identify unique key for the video source
    const bvid =
      track.currentVersion && track.currentVersion !== '无MV'
        ? track.versions?.find((v) => v.type === track.currentVersion)?.bvid
        : track.is_pjsk
          ? track.versions?.[0]?.bvid
          : track.id // Fallback for ID as BVID in some cases

    if (!bvid || !bvid.startsWith('BV')) {
      return
    }

    // Check if we already have full info (both likely populated or cached)
    // If track has them, we are good. But we might want to check if we can fill in missing ones.
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
      if (!videoInfo) {
        return
      }

      // 4. Parse Description
      const producerName = extractProducerNameFromDesc(videoInfo.desc, videoInfo.desc_v2)
      const illustratorName = extractIllustratorNameFromDesc(videoInfo.desc)

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
