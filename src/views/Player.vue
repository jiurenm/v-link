<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore, type Track } from '@/stores/player'
import ImmersivePlayer from '@/components/player/ImmersivePlayer.vue'
import exampleData from '@/mock/example.json'
import { mapSongsToTracks } from '@/utils/trackMapper'

defineOptions({
  name: 'PlayerPage',
})

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const showImmersivePlayer = ref(true)

const currentTrack = computed((): Track | null => {
  return playerStore.currentTrack
})

let intervalId: number | null = null

const handleClose = () => {
  router.back()
}

// 导入 formatTime 工具函数

// 初始化播放逻辑
const initializePlayback = async () => {
  // 从路由参数获取播放的歌曲ID
  const trackId = route.params.id as string

  // 如果播放列表为空，从示例数据初始化播放列表
  if (playerStore.queue.length === 0) {
    // 使用 trackMapper 将 JSON 数据转换为 Track 格式
    const tracks = mapSongsToTracks(exampleData as Parameters<typeof mapSongsToTracks>[0])

    // 如果提供了 trackId，找到对应的歌曲索引
    let startIndex = 0
    if (trackId) {
      const trackIndex = tracks.findIndex((t) => t.id === trackId)
      if (trackIndex >= 0) {
        startIndex = trackIndex
      }
    }

    playerStore.setQueue(tracks, startIndex)
    // 等待下一个 tick 确保状态更新
    await nextTick()
    // 确保自动开始播放
    playerStore.playTrack(startIndex)
  } else if (trackId) {
    // 如果播放列表已存在，根据 trackId 切换到对应歌曲
    const trackIndex = playerStore.queue.findIndex((t) => t.id === trackId)
    if (trackIndex >= 0) {
      // 如果点击的是当前正在播放的歌曲，保持播放进度，只确保播放状态
      if (playerStore.currentIndex === trackIndex && playerStore.currentTrack) {
        playerStore.isPlaying = true
      } else {
        // 切换到不同的歌曲时才调用 playTrack
        playerStore.playTrack(trackIndex)
      }
    } else {
      // 如果当前播放列表中没有该歌曲，确保正在播放
      if (playerStore.currentTrack) {
        playerStore.isPlaying = true
      }
    }
  } else {
    // 如果没有 trackId 但播放列表已存在，确保正在播放
    if (playerStore.currentTrack && !playerStore.isPlaying) {
      playerStore.isPlaying = true
    }
  }

  console.log('Loading track:', trackId, 'isPlaying:', playerStore.isPlaying)
}

onMounted(() => {
  initializePlayback()

  // 监听路由变化，确保每次进入播放页都自动播放
  watch(
    () => route.params.id,
    async (newId) => {
      if (newId) {
        await initializePlayback()
      }
    },
  )

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
    { immediate: true }, // 立即执行一次，确保如果已经是播放状态则启动定时器
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
  <div>
    <ImmersivePlayer
      v-if="showImmersivePlayer && currentTrack"
      :track="currentTrack"
      @close="handleClose"
    />
  </div>
</template>

<style scoped></style>
