<script setup lang="ts">
interface Props {
  id: string
  title: string
  artist: string
  cover: string
  gradient: string
}

defineProps<Props>()

const emit = defineEmits<{
  click: [id: string]
}>()
</script>

<template>
  <div class="flex-shrink-0 w-64 group cursor-pointer" @click="emit('click', id)">
    <div
      class="relative overflow-hidden rounded-xl bg-gradient-to-br aspect-square mb-3 shadow-2xl group-hover:scale-105 transition-transform duration-300"
      :class="gradient"
    >
      <img :src="cover" :alt="title" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <div class="absolute bottom-4 left-4 right-4">
        <h3 class="text-white font-bold text-lg mb-1 line-clamp-1">{{ title }}</h3>
        <p class="text-white/80 text-sm">{{ artist }}</p>
      </div>
      <div
        class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30"
      >
        <button
          class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
