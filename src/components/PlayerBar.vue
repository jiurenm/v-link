<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import PlaylistModal from './PlaylistModal.vue'
import ProgressBar from './common/ProgressBar.vue'
import PlaybackControls from './common/PlaybackControls.vue'
import VolumeControl from './common/VolumeControl.vue'

const router = useRouter()
const playerStore = usePlayerStore()

const currentTrack = computed(() => playerStore.currentTrack)
const isFavorite = ref(false)
const isLiked = ref(false)
const showPlaylistModal = ref(false)

// 移动端上滑手势
const touchStartY = ref(0)
const touchCurrentY = ref(0)
const isSwipeUp = ref(false)
const swipeOffset = ref(0)
const hasSwiped = ref(false) // 标记是否发生了滑动
const playerBarRef = ref<HTMLElement | null>(null)

const togglePlay = () => {
  playerStore.togglePlay()
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

const goToPlayer = () => {
  // 如果发生了滑动，不触发点击
  if (hasSwiped.value) {
    hasSwiped.value = false
    return
  }
  if (currentTrack.value) {
    router.push({ name: 'player', params: { id: currentTrack.value.id } })
  }
}

// 移动端上滑手势处理
const handleBarTouchStart = (e: TouchEvent) => {
  // 只在移动端启用
  if (window.innerWidth > 768) return
  if (e.touches.length !== 1) return

  const touch = e.touches[0]
  if (!touch) return

  touchStartY.value = touch.clientY
  isSwipeUp.value = false
  swipeOffset.value = 0
  hasSwiped.value = false
}

const handleBarTouchMove = (e: TouchEvent) => {
  if (window.innerWidth > 768) return
  if (e.touches.length !== 1) return

  const touch = e.touches[0]
  if (!touch) return

  touchCurrentY.value = touch.clientY
  const deltaY = touchStartY.value - touchCurrentY.value

  // 只允许向上滑动
  if (deltaY > 0) {
    isSwipeUp.value = true
    hasSwiped.value = true
    swipeOffset.value = Math.min(deltaY, 150) // 限制最大偏移
    e.preventDefault()
  }
}

const handleBarTouchEnd = () => {
  if (window.innerWidth > 768) return

  const threshold = 80 // 上滑超过 80px 时触发进入播放页
  const velocity = swipeOffset.value / 150 // 简单的速度计算

  if (swipeOffset.value > threshold || velocity > 0.5) {
    if (currentTrack.value) {
      router.push({ name: 'player', params: { id: currentTrack.value.id } })
    }
  }

  // 重置状态
  setTimeout(() => {
    isSwipeUp.value = false
    swipeOffset.value = 0
    hasSwiped.value = false
  }, 200)
}

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
  // TODO: 实现收藏功能
}

const toggleLike = () => {
  isLiked.value = !isLiked.value
  // TODO: 实现喜欢功能
}

const togglePlaylist = () => {
  showPlaylistModal.value = !showPlaylistModal.value
}

const toggleLyrics = () => {
  // TODO: 实现歌词显示功能
  console.log('Toggle lyrics')
}

const closePlayer = () => {
  playerStore.togglePlay()
  // 可以选择清空播放列表或保持
}

// 管理播放进度定时器 - 已移除，由 PersistentPlayer 统一驱动
// PersistentPlayer 会实时更新 store 中的 currentTime

onMounted(() => {
  // 移除定时器逻辑
})

onUnmounted(() => {
  // 移除定时器逻辑
})
</script>

<template>
  <div
    v-if="currentTrack"
    ref="playerBarRef"
    class="fixed bottom-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-t border-white/10 mobile-player-bar"
    :style="{
      transform: isSwipeUp ? `translateY(-${swipeOffset}px)` : '',
      transition: isSwipeUp ? '' : 'transform 0.2s ease-out',
    }"
    @touchstart="handleBarTouchStart"
    @touchmove="handleBarTouchMove"
    @touchend="handleBarTouchEnd"
  >
    <div class="container mx-auto px-2 sm:px-4 py-2">
      <!-- 主要内容区域 -->
      <div class="flex items-center gap-2 sm:gap-4">
        <!-- 左侧：封面和歌曲信息 -->
        <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0" @click="goToPlayer">
          <div
            class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden cursor-pointer relative group"
          >
            <img
              :src="currentTrack.cover"
              :alt="currentTrack.title"
              referrerpolicy="no-referrer"
              class="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            <!-- 放大图标覆盖层 -->
            <div
              class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 hidden sm:flex"
            >
              <div
                class="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <svg
                  class="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-white font-medium text-xs sm:text-sm line-clamp-1">
              {{ currentTrack.title }}
            </h4>
            <p class="text-white/60 text-[10px] sm:text-xs line-clamp-1">
              {{ currentTrack.artist }}
            </p>
            <!-- 进度条：移动端隐藏，桌面端显示 -->
            <div class="mt-1.5 hidden sm:block">
              <ProgressBar
                :progress="playerStore.progress"
                :current-time="playerStore.currentTime"
                :duration="playerStore.duration"
                size="small"
                @seek="seekTo"
              />
            </div>
          </div>
        </div>

        <PlaybackControls
          :is-playing="playerStore.isPlaying"
          :show-shuffle="false"
          :show-repeat="false"
          size="small"
          @play="togglePlay"
          @pause="togglePlay"
          @previous="playerStore.previousTrack()"
          @next="playerStore.nextTrack()"
        />

        <!-- 右侧：功能按钮 -->
        <div class="flex items-center gap-1 sm:gap-2">
          <!-- 保存/收藏 - 移动端隐藏 -->
          <button
            @click="toggleFavorite"
            class="hidden sm:flex text-white/80 hover:text-white transition-colors p-1.5"
            :class="{ 'text-primary': isFavorite }"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"
              />
            </svg>
          </button>

          <!-- 喜欢 - 移动端隐藏 -->
          <button
            @click="toggleLike"
            class="hidden sm:flex text-white/80 hover:text-white transition-colors p-1.5"
            :class="{ 'text-red-500': isLiked }"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
          </button>

          <!-- 音量控制 - 移动端隐藏 -->
          <div class="hidden sm:block">
            <VolumeControl
              :volume="playerStore.volume"
              size="small"
              @update:volume="handleVolumeUpdate"
              @mute="toggleMute"
            />
          </div>

          <button
            id="playlist-toggle-btn"
            @click="togglePlaylist"
            class="text-white/80 hover:text-white transition-colors p-1.5 relative"
          >
            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 18h18v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />
            </svg>
            <span
              v-if="playerStore.queue.length > 0"
              class="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-primary text-white text-[9px] sm:text-[10px] rounded-full flex items-center justify-center"
            >
              {{ playerStore.queue.length }}
            </span>
          </button>

          <!-- 歌词 - 移动端隐藏 -->
          <button
            @click="toggleLyrics"
            class="hidden sm:flex text-white/80 hover:text-white transition-colors p-1.5"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
              />
            </svg>
          </button>

          <!-- 关闭 - 移动端隐藏 -->
          <button
            @click="closePlayer"
            class="hidden sm:flex text-white/80 hover:text-white transition-colors p-1.5"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 移动端上滑提示 -->
    <div
      v-if="isSwipeUp && swipeOffset > 0"
      class="absolute -top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-sm flex items-center gap-2 pointer-events-none transition-opacity"
      :style="{ opacity: Math.min(1, swipeOffset / 50) }"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
      <span>上滑进入播放页</span>
    </div>

    <!-- 播放列表弹窗 -->
    <PlaylistModal v-if="showPlaylistModal" @close="showPlaylistModal = false" />
  </div>
</template>

<style scoped>
/* 移动端 PlayerBar 上移，给 MobileTabBar 让路 */
@media (max-width: 767px) {
  .mobile-player-bar {
    bottom: calc(56px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
