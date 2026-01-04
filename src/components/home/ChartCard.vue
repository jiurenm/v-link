<script setup lang="ts">
import type { Track } from '@/stores/player'
import TrackItem from '@/components/common/TrackItem.vue'

interface Props {
  id: string
  name: string
  tracks: Track[]
  emoji: string
}

defineProps<Props>()

const emit = defineEmits<{
  'track-click': [id: string]
  'track-play': [id: string]
}>()

const handleTrackClick = (track: Track) => {
  emit('track-click', track.id)
}

const handleTrackPlay = (track: Track) => {
  emit('track-play', track.id)
}
</script>

<template>
  <div
    class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors"
  >
    <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
      <span class="text-2xl">{{ emoji }}</span>
      {{ name }}
    </h3>
    <div class="space-y-3">
      <TrackItem
        v-for="(track, index) in tracks"
        :key="track.id"
        :track="track"
        :index="index + 1"
        :show-index="true"
        size="small"
        @click="handleTrackClick(track)"
        @play="handleTrackPlay(track)"
      />
    </div>
  </div>
</template>
