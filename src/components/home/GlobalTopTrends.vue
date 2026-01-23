<script setup lang="ts">
import type { Track } from '@/stores/player'

interface Props {
  tracks: Track[]
}

defineProps<Props>()

const emit = defineEmits<{
  'track-click': [id: string]
  'track-play': [id: string]
}>()

const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`
  }
  return views.toString()
}

const getRankColor = (index: number): string => {
  if (index === 0) return 'text-primary'
  if (index === 1) return 'text-white/60'
  if (index === 2) return 'text-white/50'
  return 'text-white/30'
}
</script>

<template>
  <section class="px-6 py-12 max-w-7xl mx-auto">
    <div class="flex items-center gap-3 mb-8">
      <div class="w-1 h-8 bg-primary"></div>
      <h2 class="text-2xl font-black italic uppercase tracking-widest text-white">
        Global Top Hits
      </h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="(track, index) in tracks"
        :key="track.id"
        class="relative flex items-center gap-4 p-4 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group overflow-hidden"
        @click="emit('track-click', track.id)"
      >
        <!-- 大号半透明排名数字 -->
        <span
          class="absolute left-4 text-8xl font-black italic opacity-10 select-none pointer-events-none transition-all group-hover:opacity-20"
          :class="getRankColor(index)"
        >
          {{ String(index + 1).padStart(2, '0') }}
        </span>

        <img
          :src="track.cover"
          :alt="track.title"
          referrerpolicy="no-referrer"
          class="w-16 h-16 rounded-2xl object-cover relative z-10"
        />

        <div class="flex-1 relative z-10">
          <h3 class="font-bold text-sm text-white mb-1 line-clamp-1">{{ track.title }}</h3>
          <p class="text-[10px] text-white/40 uppercase tracking-widest line-clamp-1">
            {{ track.artist }}
          </p>
        </div>

        <div class="text-right relative z-10">
          <div class="text-[10px] font-mono opacity-30 text-white/90">
            {{ formatViews(track.total_views || 0) }}
          </div>
          <div v-if="index === 0" class="text-[8px] text-primary font-bold mt-1">HOT</div>
        </div>

        <!-- Hover 时显示的播放按钮或链接 -->
        <div
          class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm rounded-3xl z-20"
        >
          <button
            class="w-12 h-12 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center hover:bg-primary transition-colors"
            @click.stop="emit('track-play', track.id)"
          >
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
