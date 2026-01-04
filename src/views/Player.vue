<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-black">
    <!-- 背景模糊效果 -->
    <div
      class="fixed inset-0 bg-cover bg-center opacity-20 blur-3xl"
      :style="{ backgroundImage: `url(${currentTrack.cover})` }"
    ></div>

    <div class="relative z-10">
      <!-- 顶部导航栏 -->
      <nav class="sticky top-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div class="container mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            <button
              @click="$router.back()"
              class="text-white/80 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>返回</span>
            </button>
            <h1 class="text-xl font-bold text-white">正在播放</h1>
            <button class="text-white/80 hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div class="container mx-auto px-4 py-8">
        <div class="flex flex-col items-center max-w-2xl mx-auto">
          <!-- 封面图片/视频 -->
          <div class="mb-8 w-full aspect-video max-w-4xl">
            <div
              class="w-full h-full rounded-3xl overflow-hidden shadow-2xl cursor-pointer relative group"
              @click="togglePlay"
            >
              <img
                :src="currentTrack.cover"
                :alt="currentTrack.title"
                class="w-full h-full object-cover"
              />
              <!-- 播放/暂停图标覆盖层 -->
              <div
                class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"
              >
                <div
                  class="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <svg
                    v-if="!isPlaying"
                    class="w-10 h-10 text-white ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <svg v-else class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                </div>
              </div>
              <!-- 后续可以在这里添加视频播放器 -->
            </div>
          </div>

          <!-- 歌曲信息 -->
          <div class="text-center mb-8 w-full">
            <h2 class="text-3xl font-bold text-white mb-2">{{ currentTrack.title }}</h2>
            <p class="text-xl text-white/70 mb-6">{{ currentTrack.artist }}</p>

            <!-- 进度条 -->
            <div class="mb-4">
              <div class="flex items-center justify-between text-sm text-white/60 mb-2">
                <span>{{ formatTime(currentTime) }}</span>
                <span>{{ formatTime(duration) }}</span>
              </div>
              <div class="relative h-1 bg-white/20 rounded-full cursor-pointer" @click="seekTo">
                <div
                  class="absolute h-full bg-primary rounded-full transition-all"
                  :style="{ width: `${progress}%` }"
                ></div>
                <div
                  class="absolute w-4 h-4 bg-primary rounded-full -top-1.5 transition-all"
                  :style="{ left: `calc(${progress}% - 8px)` }"
                ></div>
              </div>
            </div>

            <!-- 播放控制 -->
            <div class="flex items-center justify-center gap-6 mb-8">
              <button
                @click="toggleShuffle"
                class="text-white/60 hover:text-white transition-colors"
                :class="{ 'text-white': shuffle }"
              >
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
                  />
                </svg>
              </button>
              <button
                @click="previousTrack"
                class="text-white hover:text-white/80 transition-colors"
              >
                <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>
              <button
                @click="togglePlay"
                class="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg hover:bg-primary-600"
              >
                <svg v-if="!isPlaying" class="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <svg v-else class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </button>
              <button @click="nextTrack" class="text-white hover:text-white/80 transition-colors">
                <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
              <button
                @click="toggleRepeat"
                class="text-white/60 hover:text-white transition-colors"
                :class="{ 'text-white': repeat !== 'off' }"
              >
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v6z" />
                </svg>
              </button>
            </div>

            <!-- 音量控制 -->
            <div class="flex items-center justify-center gap-4">
              <svg class="w-5 h-5 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                />
              </svg>
              <div
                class="w-32 h-1 bg-white/20 rounded-full cursor-pointer relative"
                @click="setVolume"
              >
                <div
                  class="absolute h-full bg-primary rounded-full transition-all"
                  :style="{ width: `${volume * 100}%` }"
                ></div>
                <div
                  class="absolute w-4 h-4 bg-primary rounded-full -top-1.5 transition-all"
                  :style="{ left: `calc(${volume * 100}% - 8px)` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- 播放队列/相关推荐 -->
          <div class="w-full mt-12">
            <h3 class="text-xl font-bold text-white mb-4">播放队列</h3>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="(track, index) in queue"
                :key="track.id"
                class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                :class="{ 'bg-white/10': index === currentIndex }"
                @click="playTrack(index)"
              >
                <div class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
                  <img :src="track.cover" :alt="track.title" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-white font-medium line-clamp-1">{{ track.title }}</h4>
                  <p class="text-white/60 text-sm line-clamp-1">{{ track.artist }}</p>
                </div>
                <div v-if="index === currentIndex && isPlaying" class="flex-shrink-0">
                  <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import coverImage from '@/assets/images/cover.jpg'

defineOptions({
  name: 'PlayerPage',
})

const route = useRoute()

interface Track {
  id: string
  title: string
  artist: string
  cover: string
  duration: number
}

const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(180) // 3分钟示例
const volume = ref(0.7)
const shuffle = ref(false)
const repeat = ref<'off' | 'one' | 'all'>('off')
const currentIndex = ref(0)

const queue = ref<Track[]>([
  {
    id: '1',
    title: '当前播放歌曲',
    artist: '艺术家名称',
    cover: coverImage,
    duration: 180,
  },
  {
    id: '2',
    title: '下一首歌曲',
    artist: '另一个艺术家',
    cover: coverImage,
    duration: 200,
  },
  {
    id: '3',
    title: '第三首歌曲',
    artist: '第三个艺术家',
    cover: coverImage,
    duration: 195,
  },
])

const defaultTrack: Track = {
  id: '',
  title: '暂无歌曲',
  artist: '未知艺术家',
  cover: coverImage,
  duration: 0,
}

const currentTrack = computed((): Track => {
  if (queue.value.length === 0) {
    return defaultTrack
  }
  const track = queue.value[currentIndex.value]
  return track ?? queue.value[0] ?? defaultTrack
})

const progress = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

let intervalId: number | null = null

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    intervalId = window.setInterval(() => {
      if (currentTime.value < duration.value) {
        currentTime.value += 1
      } else {
        nextTrack()
      }
    }, 1000)
  } else {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
}

const previousTrack = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  } else {
    currentIndex.value = queue.value.length - 1
  }
  currentTime.value = 0
}

const nextTrack = () => {
  if (repeat.value === 'one') {
    currentTime.value = 0
    return
  }
  if (currentIndex.value < queue.value.length - 1) {
    currentIndex.value++
  } else {
    if (repeat.value === 'all') {
      currentIndex.value = 0
    } else {
      isPlaying.value = false
    }
  }
  currentTime.value = 0
}

const playTrack = (index: number) => {
  currentIndex.value = index
  currentTime.value = 0
  if (!isPlaying.value) {
    togglePlay()
  }
}

const toggleShuffle = () => {
  shuffle.value = !shuffle.value
}

const toggleRepeat = () => {
  if (repeat.value === 'off') {
    repeat.value = 'all'
  } else if (repeat.value === 'all') {
    repeat.value = 'one'
  } else {
    repeat.value = 'off'
  }
}

const seekTo = (event: MouseEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  currentTime.value = Math.max(0, Math.min(duration.value, percent * duration.value))
}

const setVolume = (event: MouseEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  volume.value = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

onMounted(() => {
  // 从路由参数获取播放的歌曲ID，这里简化处理
  const trackId = route.params.id as string
  // 可以根据ID加载对应的歌曲数据
  // TODO: 根据 trackId 加载对应的歌曲数据并更新 queue
  console.log('Loading track:', trackId)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped></style>
