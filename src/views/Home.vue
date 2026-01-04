<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore, type Track } from '@/stores/player'
import coverImage from '@/assets/images/cover.jpg'
import NavBar from '@/components/common/NavBar.vue'
import FeaturedSection from '@/components/home/FeaturedSection.vue'
import ChartSection from '@/components/home/ChartSection.vue'

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

const featuredItems = ref<FeaturedItem[]>([
  {
    id: '1',
    title: '热门单曲推荐',
    artist: 'Various Artists',
    cover: coverImage,
  },
  {
    id: '2',
    title: '最新音乐',
    artist: 'Various Artists',
    cover: coverImage,
  },
  {
    id: '3',
    title: '精选歌单',
    artist: 'Various Artists',
    cover: coverImage,
  },
  {
    id: '4',
    title: '流行音乐',
    artist: 'Various Artists',
    cover: coverImage,
  },
  {
    id: '5',
    title: '电子音乐',
    artist: 'Various Artists',
    cover: coverImage,
  },
])

const charts = ref<Chart[]>([
  {
    id: 'daily',
    name: '日榜',
    tracks: [
      {
        id: 't1',
        title: '歌曲标题 1',
        artist: '艺术家 A',
        cover: coverImage,
        duration: 180,
      },
      {
        id: 't2',
        title: '歌曲标题 2',
        artist: '艺术家 B',
        cover: coverImage,
        duration: 195,
      },
      {
        id: 't3',
        title: '歌曲标题 3',
        artist: '艺术家 C',
        cover: coverImage,
        duration: 200,
      },
      {
        id: 't4',
        title: '歌曲标题 4',
        artist: '艺术家 D',
        cover: coverImage,
        duration: 175,
      },
      {
        id: 't5',
        title: '歌曲标题 5',
        artist: '艺术家 E',
        cover: coverImage,
        duration: 190,
      },
    ],
  },
  {
    id: 'weekly',
    name: '周榜',
    tracks: [
      {
        id: 't6',
        title: '歌曲标题 6',
        artist: '艺术家 F',
        cover: coverImage,
        duration: 185,
      },
      {
        id: 't7',
        title: '歌曲标题 7',
        artist: '艺术家 G',
        cover: coverImage,
        duration: 210,
      },
      {
        id: 't8',
        title: '歌曲标题 8',
        artist: '艺术家 H',
        cover: coverImage,
        duration: 195,
      },
      {
        id: 't9',
        title: '歌曲标题 9',
        artist: '艺术家 I',
        cover: coverImage,
        duration: 180,
      },
      {
        id: 't10',
        title: '歌曲标题 10',
        artist: '艺术家 J',
        cover: coverImage,
        duration: 200,
      },
    ],
  },
  {
    id: 'monthly',
    name: '月榜',
    tracks: [
      {
        id: 't11',
        title: '歌曲标题 11',
        artist: '艺术家 K',
        cover: coverImage,
        duration: 190,
      },
      {
        id: 't12',
        title: '歌曲标题 12',
        artist: '艺术家 L',
        cover: coverImage,
        duration: 205,
      },
      {
        id: 't13',
        title: '歌曲标题 13',
        artist: '艺术家 M',
        cover: coverImage,
        duration: 180,
      },
      {
        id: 't14',
        title: '歌曲标题 14',
        artist: '艺术家 N',
        cover: coverImage,
        duration: 195,
      },
      {
        id: 't15',
        title: '歌曲标题 15',
        artist: '艺术家 O',
        cover: coverImage,
        duration: 200,
      },
    ],
  },
])

const goToPlayer = (id: string) => {
  // 从所有榜单中收集所有歌曲作为播放列表
  const allTracks: Track[] = []
  charts.value.forEach((chart) => {
    allTracks.push(...chart.tracks)
  })

  // 找到当前点击的歌曲索引
  const trackIndex = allTracks.findIndex((track) => track.id === id)

  // 设置播放列表并播放
  if (trackIndex >= 0) {
    playerStore.setQueue(allTracks, trackIndex)
    playerStore.togglePlay()
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
