<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PlayerBar from '@/components/PlayerBar.vue'
import PersistentPlayer from '@/components/PersistentPlayer.vue'
import FlyAnimationContainer from '@/components/common/FlyAnimationContainer.vue'
import { usePlayerStore } from '@/stores/player'

const route = useRoute()
const playerStore = usePlayerStore()

// 在播放页不显示底栏，但如果有正在播放的歌曲则显示
const showPlayerBar = computed(() => {
  if (route.name === 'player') return false
  return playerStore.currentTrack !== null
})
</script>

<template>
  <div
    :class="{ 'pb-20': showPlayerBar }"
    class="min-h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-primary-700"
  >
    <router-view />
  </div>
  <PlayerBar v-if="showPlayerBar" />
  <PersistentPlayer />
  <FlyAnimationContainer />
</template>

<style scoped></style>
