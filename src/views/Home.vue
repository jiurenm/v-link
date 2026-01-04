<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-primary-700">
    <!-- 顶部导航栏 -->
    <nav class="sticky top-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-primary">V-Link Music</h1>
          <div class="flex items-center gap-4">
            <button class="text-white/80 hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button class="text-white/80 hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
      <!-- 横向滚动推荐位 -->
      <section class="mb-12">
        <h2 class="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <span class="text-primary">🎵</span>
          精选推荐
        </h2>
        <div class="overflow-x-auto scrollbar-hide">
          <div class="flex gap-6 pb-4">
            <div
              v-for="(item, index) in featuredItems"
              :key="item.id"
              class="flex-shrink-0 w-64 group cursor-pointer"
              @click="goToPlayer(item.id)"
            >
              <div
                class="relative overflow-hidden rounded-xl bg-gradient-to-br aspect-square mb-3 shadow-2xl group-hover:scale-105 transition-transform duration-300"
                :class="getFeaturedGradient(index)"
              >
                <img :src="item.cover" :alt="item.title" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div class="absolute bottom-4 left-4 right-4">
                  <h3 class="text-white font-bold text-lg mb-1 line-clamp-1">{{ item.title }}</h3>
                  <p class="text-white/80 text-sm">{{ item.artist }}</p>
                </div>
                <div
                  class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30"
                >
                  <button
                    class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 纵向排行榜 -->
      <section>
        <h2 class="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <span class="text-primary">🏆</span>
          热门榜单
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="(chart, index) in charts"
            :key="chart.id"
            class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors"
          >
            <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span class="text-2xl">{{ getChartEmoji(index) }}</span>
              {{ chart.name }}
            </h3>
            <div class="space-y-3">
              <div
                v-for="(track, trackIndex) in chart.tracks"
                :key="track.id"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors group"
                @click="goToPlayer(track.id)"
              >
                <div class="flex-shrink-0 w-8 text-center">
                  <span class="text-white/60 font-bold text-sm">{{ trackIndex + 1 }}</span>
                </div>
                <div class="flex-shrink-0 w-28 h-16 rounded-lg overflow-hidden">
                  <img :src="track.cover" :alt="track.title" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <h4
                    class="text-white font-medium line-clamp-1 group-hover:text-primary transition-colors"
                  >
                    {{ track.title }}
                  </h4>
                  <p class="text-white/60 text-sm line-clamp-1">{{ track.artist }}</p>
                </div>
                <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
                  >
                    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import coverImage from '@/assets/images/cover.jpg'

defineOptions({
  name: 'HomePage',
})

const router = useRouter()

interface FeaturedItem {
  id: string
  title: string
  artist: string
  cover: string
}

interface Track {
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
      },
      {
        id: 't2',
        title: '歌曲标题 2',
        artist: '艺术家 B',
        cover: coverImage,
      },
      {
        id: 't3',
        title: '歌曲标题 3',
        artist: '艺术家 C',
        cover: coverImage,
      },
      {
        id: 't4',
        title: '歌曲标题 4',
        artist: '艺术家 D',
        cover: coverImage,
      },
      {
        id: 't5',
        title: '歌曲标题 5',
        artist: '艺术家 E',
        cover: coverImage,
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
      },
      {
        id: 't7',
        title: '歌曲标题 7',
        artist: '艺术家 G',
        cover: coverImage,
      },
      {
        id: 't8',
        title: '歌曲标题 8',
        artist: '艺术家 H',
        cover: coverImage,
      },
      {
        id: 't9',
        title: '歌曲标题 9',
        artist: '艺术家 I',
        cover: coverImage,
      },
      {
        id: 't10',
        title: '歌曲标题 10',
        artist: '艺术家 J',
        cover: coverImage,
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
      },
      {
        id: 't12',
        title: '歌曲标题 12',
        artist: '艺术家 L',
        cover: coverImage,
      },
      {
        id: 't13',
        title: '歌曲标题 13',
        artist: '艺术家 M',
        cover: coverImage,
      },
      {
        id: 't14',
        title: '歌曲标题 14',
        artist: '艺术家 N',
        cover: coverImage,
      },
      {
        id: 't15',
        title: '歌曲标题 15',
        artist: '艺术家 O',
        cover: coverImage,
      },
    ],
  },
])

const getChartEmoji = (index: number): string => {
  const emojis = ['🥇', '🥈', '🥉']
  return emojis[index] || '📊'
}

const getFeaturedGradient = (index: number): string => {
  const gradients = [
    'from-primary to-accent-blue', // 主题色到蓝色
    'from-accent-pink to-accent-purple', // 粉色到紫色
    'from-accent-blue to-primary', // 蓝色到主题色
    'from-accent-green to-primary', // 绿色到主题色
    'from-accent-orange to-accent-pink', // 橙色到粉色
  ]
  return gradients[index % gradients.length]
}

const goToPlayer = (id: string) => {
  router.push({ name: 'player', params: { id } })
}
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
