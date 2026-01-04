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
}>()

const coverSizeClass = {
  small: 'w-12 h-12',
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
    <div :class="['flex-shrink-0 rounded-lg overflow-hidden', coverSizeClass[size]]">
      <img :src="track.cover" :alt="track.title" class="w-full h-full object-cover" />
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
      <button
        v-else
        @click.stop="emit('play')"
        class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
      >
        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
    </div>
  </div>
</template>
