<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore, type Track } from '@/stores/player'
import ImmersivePlayer from '@/components/player/ImmersivePlayer.vue'
import { fetchTracks } from '@/services/dataService'

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

const handleClose = () => {
  router.back()
}

// 初始化播放逻辑
const initializePlayback = async () => {
  // 从路由参数获取播放的歌曲ID
  const trackId = route.params.id as string

  if (!trackId) return

  // 1. 尝试在当前队列中找
  const existingIndex = playerStore.queue.findIndex((t) => t.id === trackId)
  if (existingIndex >= 0) {
    if (playerStore.currentIndex !== existingIndex) {
      playerStore.playTrack(existingIndex)
    } else {
      playerStore.isPlaying = true
    }
    return
  }

  // 2. 如果没找到，从全局数据中找并加入队列
  const tracks = await fetchTracks()
  const targetTrack = tracks.find((t) => t.id === trackId)

  if (targetTrack) {
    playerStore.playTrackNow(targetTrack)
  } else {
    console.warn(`Track with id ${trackId} not found in database.`)
  }
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
</script>

<template>
  <div>
    <ImmersivePlayer
      v-if="showImmersivePlayer && currentTrack"
      :track="currentTrack"
      @close="handleClose"
      @ended="playerStore.nextTrack()"
    />
  </div>
</template>

<style scoped></style>
