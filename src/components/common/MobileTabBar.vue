<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const hasPlayer = computed(() => playerStore.currentTrack !== null)

const tabs = [
  { name: 'home', label: '首页', path: '/' },
  { name: 'explore', label: '探索', path: '/explore' },
]

const activeTab = computed(() => {
  if (route.name === 'explore') return 'explore'
  if (route.name === 'home') return 'home'
  return ''
})

const navigate = (path: string) => {
  router.push(path)
}

const togglePlaylist = () => {
  // 触发播放列表弹窗事件
  playerStore.togglePlaylistModal()
}
</script>

<template>
  <nav class="mobile-tab-bar md:hidden" :class="{ 'has-player': hasPlayer }">
    <!-- 首页 -->
    <button
      v-for="tab in tabs"
      :key="tab.name"
      @click="navigate(tab.path)"
      class="tab-item"
      :class="{ active: activeTab === tab.name }"
    >
      <!-- 首页图标 -->
      <svg
        v-if="tab.name === 'home'"
        class="tab-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
      <!-- 探索图标 -->
      <svg
        v-if="tab.name === 'explore'"
        class="tab-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <span class="tab-label">{{ tab.label }}</span>
    </button>

    <!-- 播放列表 Tab -->
    <button @click="togglePlaylist" class="tab-item">
      <div class="relative">
        <svg class="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        <span
          v-if="playerStore.queue.length > 0"
          class="absolute -top-1.5 -right-2 w-4 h-4 bg-primary text-white text-[9px] rounded-full flex items-center justify-center font-bold"
        >
          {{ playerStore.queue.length > 9 ? '9+' : playerStore.queue.length }}
        </span>
      </div>
      <span class="tab-label">列表</span>
    </button>
  </nav>
</template>

<style scoped>
.mobile-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 56px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: rgba(6, 9, 14, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.mobile-tab-bar.has-player {
  /* PlayerBar 高度约 64px，TabBar 在其下方 */
  bottom: 0;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 16px;
  color: rgba(255, 255, 255, 0.35);
  transition: color 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.tab-item.active {
  color: #39c5bb;
}

.tab-item:active {
  transform: scale(0.92);
}

.tab-icon {
  width: 22px;
  height: 22px;
}

.tab-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
</style>
