<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore, type Track } from '@/stores/player'
import coverImage from '@/assets/images/cover.jpg'
import NavBar from '@/components/common/NavBar.vue'
import CoverImage from '@/components/player/CoverImage.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import PlaybackControls from '@/components/common/PlaybackControls.vue'
import VolumeControl from '@/components/common/VolumeControl.vue'
import QueueList from '@/components/player/QueueList.vue'

defineOptions({
  name: 'PlayerPage',
})

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const defaultTrack: Track = {
  id: '',
  title: '暂无歌曲',
  artist: '未知艺术家',
  cover: coverImage,
  duration: 0,
}

const currentTrack = computed((): Track => {
  return playerStore.currentTrack ?? defaultTrack
})

const progress = computed(() => playerStore.progress)

let intervalId: number | null = null

const togglePlay = () => {
  playerStore.togglePlay()
}

const playTrack = (index: number) => {
  playerStore.playTrack(index)
  if (!playerStore.isPlaying) {
    togglePlay()
  }
}

const seekTo = (event: MouseEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  playerStore.setCurrentTime(percent * playerStore.duration)
}

const handleVolumeUpdate = (volume: number) => {
  playerStore.setVolume(volume)
}

const toggleMute = () => {
  if (playerStore.volume > 0) {
    playerStore.setVolume(0)
  } else {
    playerStore.setVolume(0.7)
  }
}

// 导入 formatTime 工具函数

onMounted(() => {
  // 从路由参数获取播放的歌曲ID，这里简化处理
  const trackId = route.params.id as string

  // 如果播放列表为空，初始化一个示例播放列表
  if (playerStore.queue.length === 0) {
    const defaultQueue: Track[] = [
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
    ]
    playerStore.setQueue(defaultQueue, 0)
  }

  // 可以根据ID加载对应的歌曲数据
  // TODO: 根据 trackId 加载对应的歌曲数据并更新 queue
  console.log('Loading track:', trackId)

  // 监听播放状态变化，更新定时器
  watch(
    () => playerStore.isPlaying,
    (playing) => {
      if (playing) {
        if (!intervalId) {
          intervalId = window.setInterval(() => {
            if (playerStore.currentTime < playerStore.duration) {
              playerStore.setCurrentTime(playerStore.currentTime + 1)
            } else {
              playerStore.nextTrack()
            }
          }, 1000)
        }
      } else {
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      }
    },
  )

  // 监听当前歌曲变化，重置时间
  watch(
    () => playerStore.currentIndex,
    () => {
      if (playerStore.currentTrack) {
        playerStore.setDuration(playerStore.currentTrack.duration)
      }
    },
  )
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-black">
    <!-- 背景模糊效果 -->
    <div
      class="fixed inset-0 bg-cover bg-center opacity-20 blur-3xl"
      :style="{ backgroundImage: `url(${currentTrack.cover})` }"
    ></div>

    <div class="relative z-10">
      <NavBar title="正在播放" :show-back="true" :show-menu="true" @back="router.back()" />

      <div class="container mx-auto px-4 py-8">
        <div class="flex flex-col items-center max-w-2xl mx-auto">
          <CoverImage
            :cover="currentTrack.cover"
            :title="currentTrack.title"
            :is-playing="playerStore.isPlaying"
            @click="togglePlay"
          />

          <!-- 歌曲信息 -->
          <div class="text-center mb-8 w-full">
            <h2 class="text-3xl font-bold text-white mb-2">{{ currentTrack.title }}</h2>
            <p class="text-xl text-white/70 mb-6">{{ currentTrack.artist }}</p>

            <div class="mb-4">
              <ProgressBar
                :progress="progress"
                :current-time="playerStore.currentTime"
                :duration="playerStore.duration"
                size="large"
                @seek="seekTo"
              />
            </div>

            <div class="mb-8">
              <PlaybackControls
                :is-playing="playerStore.isPlaying"
                :shuffle="playerStore.shuffle"
                :repeat="playerStore.repeat"
                size="large"
                @play="togglePlay"
                @pause="togglePlay"
                @previous="playerStore.previousTrack()"
                @next="playerStore.nextTrack()"
                @toggle-shuffle="playerStore.toggleShuffle()"
                @toggle-repeat="playerStore.toggleRepeat()"
              />
            </div>

            <div class="flex items-center justify-center mb-8">
              <VolumeControl
                :volume="playerStore.volume"
                size="medium"
                @update:volume="handleVolumeUpdate"
                @mute="toggleMute"
              />
            </div>
          </div>

          <QueueList
            :tracks="playerStore.queue"
            :current-index="playerStore.currentIndex"
            :is-playing="playerStore.isPlaying"
            @track-click="playTrack"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
