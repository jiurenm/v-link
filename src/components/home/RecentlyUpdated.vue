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

const formatDate = (timestamp?: number): string => {
  if (!timestamp) return ''
  // If timestamp is in seconds (10 digits), convert to milliseconds
  const date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp)

  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // Within 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    if (hours < 1) return 'JUST NOW'
    return `${hours}H AGO`
  }

  // Within 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}D AGO`
  }

  // Format as YYYY-MM-DD
  return date.toLocaleDateString()
}
</script>

<template>
  <section class="px-6 py-12 max-w-7xl mx-auto">
    <div class="flex items-center gap-3 mb-8">
      <div class="w-1 h-8 bg-emerald-400"></div>
      <h2 class="text-2xl font-black italic uppercase tracking-widest text-white">
        Recently Updated
      </h2>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
      <div
        v-for="track in tracks"
        :key="track.id"
        class="relative p-4 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group overflow-hidden"
        @click="emit('track-click', track.id)"
      >
        <div class="aspect-square rounded-2xl overflow-hidden mb-4 relative">
          <img
            :src="track.cover"
            :alt="track.title"
            referrerpolicy="no-referrer"
            class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          />

          <!-- Hover Play Button -->
          <div
            class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm z-20"
          >
            <button
              class="w-12 h-12 rounded-full bg-emerald-400/90 backdrop-blur-sm flex items-center justify-center hover:bg-emerald-400 transition-colors shadow-lg"
              @click.stop="emit('track-play', track.id)"
            >
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>

        <div>
          <h3 class="font-bold text-sm text-white mb-1 line-clamp-1">{{ track.title }}</h3>
          <p class="text-[10px] text-white/40 uppercase tracking-widest mb-2 line-clamp-1">
            {{ track.artist }}
          </p>
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <div class="text-[10px] text-emerald-400/80 font-mono tracking-wider">
              {{ formatDate(track.updated_at) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
