<script setup lang="ts">
import type { Track } from '@/stores/player'
import TrackItem from '@/components/common/TrackItem.vue'

interface Props {
  tracks: Track[]
  currentIndex: number
  isPlaying: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'track-click': [index: number]
}>()
</script>

<template>
  <div class="w-full mt-12">
    <h3 class="text-xl font-bold text-white mb-4">播放队列</h3>
    <div class="space-y-2 max-h-64 overflow-y-auto">
      <TrackItem
        v-for="(track, index) in tracks"
        :key="track.id"
        :track="track"
        :is-active="index === currentIndex"
        :is-playing="index === currentIndex && isPlaying"
        size="small"
        :show-play-button="false"
        @click="emit('track-click', index)"
      />
    </div>
  </div>
</template>
