<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore, type Track } from '@/stores/player'
import NavBar from '@/components/common/NavBar.vue'
import FeaturedSection from '@/components/home/FeaturedSection.vue'
import ChartSection from '@/components/home/ChartSection.vue'
import exampleData from '@/mock/example.json'
import { mapSongsToTracks } from '@/utils/trackMapper'

defineOptions({
  name: 'HomePage',
})

const router = useRouter()
const playerStore = usePlayerStore()

interface FeaturedItem {
  id: string
  title: string
  artist: string
  cover: string
}

interface Chart {
  id: string
  name: string
  tracks: Track[]
}

const featuredItems = ref<FeaturedItem[]>([])

const charts = ref<Chart[]>([])

// 从示例数据初始化排行榜和推荐
onMounted(() => {
  const tracks = mapSongsToTracks(exampleData as Parameters<typeof mapSongsToTracks>[0])

  charts.value = [
    {
      id: 'daily',
      name: '日榜',
      tracks: tracks.slice(0, 5), // 取前5首
    },
    {
      id: 'weekly',
      name: '周榜',
      tracks: tracks.slice(0, 3), // 取前3首
    },
  ]

  // 使用示例数据的前几首作为推荐，使用真实的 track id
  featuredItems.value = tracks.slice(0, 5).map((track) => ({
    id: track.id, // 使用真实的歌曲 ID
    title: track.title,
    artist: track.artist,
    cover: track.cover,
  }))
})

const goToPlayer = (id: string) => {
  // 从所有榜单和推荐中收集所有歌曲作为播放列表
  const allTracks: Track[] = []
  charts.value.forEach((chart) => {
    allTracks.push(...chart.tracks)
  })

  // 如果点击的是推荐项，需要从完整的示例数据中查找
  let targetTrack: Track | undefined = allTracks.find((track) => track.id === id)

  // 如果在当前列表中找不到，从完整数据中查找
  if (!targetTrack) {
    const allExampleTracks = mapSongsToTracks(exampleData as Parameters<typeof mapSongsToTracks>[0])
    targetTrack = allExampleTracks.find((track) => track.id === id)
    if (targetTrack) {
      // 使用完整的示例数据作为播放列表
      const trackIndex = allExampleTracks.findIndex((t) => t.id === id)
      if (trackIndex >= 0) {
        playerStore.setQueue(allExampleTracks, trackIndex)
        playerStore.isPlaying = true
        playerStore.playTrack(trackIndex)
        router.push({ name: 'player', params: { id } })
        return
      }
    }
  }

  // 找到当前点击的歌曲索引
  const trackIndex = allTracks.findIndex((track) => track.id === id)

  // 设置播放列表并播放指定歌曲
  if (trackIndex >= 0) {
    playerStore.setQueue(allTracks, trackIndex)
    // 强制设置为播放状态
    playerStore.isPlaying = true
    // 使用 playTrack 确保切换到指定歌曲
    playerStore.playTrack(trackIndex)
  }

  router.push({ name: 'player', params: { id } })
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-primary-700">
    <NavBar />
    <div class="container mx-auto px-4 py-8">
      <FeaturedSection :items="featuredItems" @item-click="goToPlayer" />
      <ChartSection :charts="charts" @track-click="goToPlayer" @track-play="goToPlayer" />
    </div>
  </div>
</template>
