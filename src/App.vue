<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PlayerBar from '@/components/PlayerBar.vue'
import PersistentPlayer from '@/components/PersistentPlayer.vue'
import FlyAnimationContainer from '@/components/common/FlyAnimationContainer.vue'
import MobileTabBar from '@/components/common/MobileTabBar.vue'
import PlaylistModal from '@/components/PlaylistModal.vue'
import { usePlayerStore } from '@/stores/player'

const route = useRoute()
const playerStore = usePlayerStore()

// 在播放页不显示底栏，但如果有正在播放的歌曲则显示
const showPlayerBar = computed(() => {
  if (route.name === 'player') return false
  return playerStore.currentTrack !== null
})

// 播放页不显示底部导航
const showMobileTabBar = computed(() => {
  return route.name !== 'player'
})
</script>

<template>
  <div
    :class="{
      'pb-20': showPlayerBar,
      'mobile-has-tabbar': showMobileTabBar,
    }"
    class="min-h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-primary-700"
  >
    <router-view />
  </div>
  <PlayerBar v-if="showPlayerBar" />
  <MobileTabBar v-if="showMobileTabBar" />
  <PersistentPlayer />
  <FlyAnimationContainer />

  <!-- 全局播放列表弹窗（由 MobileTabBar 触发） -->
  <PlaylistModal
    v-if="playerStore.showPlaylistModal"
    @close="playerStore.showPlaylistModal = false"
  />
</template>

<style scoped>
/* 移动端：为底部 TabBar 预留额外空间 */
@media (max-width: 767px) {
  .mobile-has-tabbar {
    padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
  }
  .mobile-has-tabbar.pb-20 {
    /* PlayerBar(80px) + TabBar(56px) + safe area */
    padding-bottom: calc(136px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
