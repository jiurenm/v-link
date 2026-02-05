<script setup lang="ts">
import type { Track } from '@/stores/player'

interface Props {
  track: Track
  index?: number
  showIndex?: boolean
  showPlayButton?: boolean
  isActive?: boolean
  isPlaying?: boolean
  size?: 'small' | 'medium'
}

withDefaults(defineProps<Props>(), {
  showIndex: false,
  showPlayButton: true,
  isActive: false,
  isPlaying: false,
  size: 'medium',
})

const emit = defineEmits<{
  click: []
  play: []
  'add-to-queue': [event: MouseEvent]
}>()

const coverSizeClass = {
  small: 'w-20 aspect-video', // 16:9 比例
  medium: 'w-28 h-16',
}
</script>

<template>
  <div
    class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors group"
    :class="{ 'bg-white/10': isActive }"
    @click="emit('click')"
  >
    <div v-if="showIndex" class="flex-shrink-0 w-8 text-center">
      <span class="text-white/60 font-bold text-sm">{{ index }}</span>
    </div>
    <div :class="['flex-shrink-0 rounded overflow-hidden', coverSizeClass[size]]">
      <img
        :src="track.cover"
        :alt="track.title"
        referrerpolicy="no-referrer"
        class="w-full h-full object-cover"
      />
    </div>
    <div class="flex-1 min-w-0">
      <h4 class="text-white font-medium line-clamp-1 group-hover:text-primary transition-colors">
        {{ track.title }}
      </h4>
      <p class="text-white/60 text-sm line-clamp-1">{{ track.artist }}</p>
    </div>
    <div
      v-if="showPlayButton"
      class="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <div v-if="isActive && isPlaying" class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
      <span v-if="isActive" class="text-primary text-sm">正在播放</span>

      <div v-else class="flex items-center gap-1.5">
        <button
          @click.stop="emit('add-to-queue', $event)"
          title="加入播放列表"
          class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <svg class="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
        <button
          @click.stop="emit('play')"
          title="立即播放"
          class="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center hover:bg-primary transition-colors"
        >
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
