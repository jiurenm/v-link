<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '@/stores/player'

const emit = defineEmits<{
  close: []
}>()

const playerStore = usePlayerStore()
const modalContentRef = ref<HTMLElement | null>(null)

const playTrack = (index: number) => {
  playerStore.playTrack(index)
}

// 处理点击外部区域关闭
const handleClickOutside = (event: MouseEvent) => {
  if (modalContentRef.value && !modalContentRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  // 延迟添加监听，确保 DOM 已渲染
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside)
  }, 100)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
    <div
      ref="modalContentRef"
      class="playlist-modal-content w-full max-w-2xl max-h-[80vh] bg-black/90 backdrop-blur-md border-t border-white/10 rounded-t-2xl overflow-hidden flex flex-col"
      @click.stop
    >
      <!-- 头部 -->
      <div class="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
        <h2 class="text-xl font-bold text-white">播放列表</h2>
        <button @click="emit('close')" class="text-white/80 hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>
      </div>

      <!-- 播放列表内容 -->
      <div class="flex-1 overflow-y-auto p-4 min-h-0">
        <div v-if="playerStore.queue.length === 0" class="text-center text-white/60 py-12">
          <p>播放列表为空</p>
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="(track, index) in playerStore.queue"
            :key="track.id"
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors group"
            :class="{ 'bg-white/10': index === playerStore.currentIndex }"
            @click.stop="playTrack(index)"
          >
            <div class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
              <img :src="track.cover" :alt="track.title" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-white font-medium line-clamp-1">{{ track.title }}</h4>
              <p class="text-white/60 text-sm line-clamp-1">{{ track.artist }}</p>
            </div>
            <div class="flex items-center gap-2">
              <div
                v-if="index === playerStore.currentIndex && playerStore.isPlaying"
                class="flex-shrink-0"
              >
                <div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              </div>
              <span v-if="index === playerStore.currentIndex" class="text-primary text-sm"
                >正在播放</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 确保滚动条可见且样式美观 */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.5);
}
</style>
