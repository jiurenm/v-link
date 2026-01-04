<script setup lang="ts">
interface Props {
  cover: string
  title: string
  isPlaying: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <div class="mb-8 w-full aspect-video max-w-4xl">
    <div
      class="w-full h-full rounded-3xl overflow-hidden shadow-2xl cursor-pointer relative group"
      @click="emit('click')"
    >
      <img :src="cover" :alt="title" class="w-full h-full object-cover" />
      <!-- 播放/暂停图标覆盖层 -->
      <div
        class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"
      >
        <div
          class="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <svg
            v-if="!isPlaying"
            class="w-10 h-10 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <svg v-else class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>
