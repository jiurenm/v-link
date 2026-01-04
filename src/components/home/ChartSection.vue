<script setup lang="ts">
import type { Track } from '@/stores/player'
import ChartCard from './ChartCard.vue'

interface Chart {
  id: string
  name: string
  tracks: Track[]
}

interface Props {
  charts: Chart[]
}

defineProps<Props>()

const emit = defineEmits<{
  'track-click': [id: string]
  'track-play': [id: string]
}>()

const getChartEmoji = (index: number): string => {
  const emojis = ['🥇', '🥈', '🥉']
  return emojis[index] || '📊'
}
</script>

<template>
  <section>
    <h2 class="text-3xl font-bold text-white mb-6 flex items-center gap-2">
      <span class="text-primary">🏆</span>
      热门榜单
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ChartCard
        v-for="(chart, index) in charts"
        :key="chart.id"
        :id="chart.id"
        :name="chart.name"
        :tracks="chart.tracks"
        :emoji="getChartEmoji(index)"
        @track-click="emit('track-click', $event)"
        @track-play="emit('track-play', $event)"
      />
    </div>
  </section>
</template>
