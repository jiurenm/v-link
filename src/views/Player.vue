<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue'
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

  // 如果没有 trackId，且列表为空，则什么都不做，保持列表为空
  if (!trackId) {
    return
  }

  // 如果播放列表为空，则从服务获取数据并定位该歌曲
  if (playerStore.queue.length === 0) {
    const tracks = await fetchTracks()
    const trackIndex = tracks.findIndex((t) => t.id === trackId)

    if (trackIndex >= 0) {
      playerStore.setQueue(tracks, trackIndex)
      await nextTick()
      playerStore.playTrack(trackIndex)
    } else {
      console.warn(`Track with id ${trackId} not found in database.`)
    }
  } else {
    // 如果播放列表已存在，根据 trackId 切换到对应歌曲
    const trackIndex = playerStore.queue.findIndex((t) => t.id === trackId)
    if (trackIndex >= 0) {
      if (playerStore.currentIndex === trackIndex && playerStore.currentTrack) {
        playerStore.isPlaying = true
      } else {
        playerStore.playTrack(trackIndex)
      }
    }
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
