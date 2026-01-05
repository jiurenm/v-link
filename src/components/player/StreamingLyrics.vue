<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Track } from '@/stores/player'

interface Props {
  track: Track | null
  currentTime: number
  showTranslation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTranslation: false,
})

const lyricsContainerRef = ref<HTMLDivElement>()
const currentLineIndex = ref(0)

const lyrics = computed(() => {
  return props.track?.lyrics || []
})

// 根据当前时间找到对应的歌词行
watch(
  () => props.currentTime,
  (time) => {
    if (lyrics.value.length === 0) return

    for (let i = lyrics.value.length - 1; i >= 0; i--) {
      const line = lyrics.value[i]
      if (line && time >= line.time) {
        currentLineIndex.value = i
        break
      }
    }

    // 滚动到当前行
    if (lyricsContainerRef.value) {
      const currentLine = lyricsContainerRef.value.children[currentLineIndex.value] as HTMLElement
      if (currentLine) {
        currentLine.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <div ref="lyricsContainerRef" class="streaming-lyrics space-y-4 max-h-64 overflow-y-auto">
    <div
      v-for="(line, index) in lyrics"
      :key="index"
      :class="[
        'lyrics-line transition-all duration-300 text-center',
        index === currentLineIndex
          ? 'text-2xl font-bold text-white scale-110'
          : 'text-base text-white/30',
      ]"
      :style="{
        textShadow:
          index === currentLineIndex
            ? '0 0 20px rgba(57, 197, 187, 0.8), 0 0 40px rgba(57, 197, 187, 0.4)'
            : 'none',
      }"
    >
      <div>{{ line.text }}</div>
      <div
        v-if="showTranslation && line.translation"
        :class="[
          'mt-1',
          index === currentLineIndex ? 'text-lg text-white/70' : 'text-sm text-white/20',
        ]"
      >
        {{ line.translation }}
      </div>
    </div>

    <div v-if="lyrics.length === 0" class="text-center text-white/30 py-8">暂无歌词</div>
  </div>
</template>

<style scoped>
.streaming-lyrics {
  scrollbar-width: thin;
  scrollbar-color: rgba(57, 197, 187, 0.3) transparent;
}

.streaming-lyrics::-webkit-scrollbar {
  width: 4px;
}

.streaming-lyrics::-webkit-scrollbar-track {
  background: transparent;
}

.streaming-lyrics::-webkit-scrollbar-thumb {
  background: rgba(57, 197, 187, 0.3);
  border-radius: 2px;
}
</style>
