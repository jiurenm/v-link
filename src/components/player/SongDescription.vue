<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Track } from '@/stores/player'

const props = defineProps<{
  track: Track | null
}>()

const description = ref<string | null>(null)
const loading = ref(false)

const fetchDescription = async (wikiId: string) => {
  loading.value = true
  description.value = null
  try {
    // Use Vite dev server proxy to bypass CORS
    // Proxy configured in vite.config.ts: /pjsekai -> https://pjsekai.com
    const response = await fetch(`/pjsekai/?${wikiId}`)
    if (!response.ok) throw new Error('Network response was not ok')

    const text = await response.text()

    // Extract content logic:
    // Look for <公式Xより> or <公式Twitterより> and extract meaningful content.
    // Regex to find the <p> containing the marker and capture its content
    const match = text.match(/<p>.*?＜公式(?:X|Twitter)より＞(.*?)<\/p>/s)

    if (match && match[1]) {
      let content = match[1].trim()

      // Remove leading <br> if any
      content = content.replace(/^(<br\s*\/?>\s*)+/i, '')

      description.value = content
    } else {
      // Fallback: search for just the text marker if it's not in a P tag exactly as expected
      const simpleMatch = text.match(
        /＜公式(?:X|Twitter)より＞(.*?)(?:<\/div>|<\/p>|<br\s*\/?>\s*<br\s*\/?>)/s,
      )
      if (simpleMatch && simpleMatch[1]) {
        description.value = simpleMatch[1].trim().replace(/^(<br\s*\/?>\s*)+/i, '')
      }
    }
  } catch (e) {
    console.warn('Failed to fetch song description:', e)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.track,
  (newTrack) => {
    if (newTrack?.is_pjsk && newTrack?.wiki_id) {
      fetchDescription(newTrack.wiki_id)
    } else {
      description.value = null
    }
  },
  { immediate: true },
)
</script>

<template>
  <transition name="fade">
    <div v-if="description" class="glass-card p-6 rounded-xl text-center">
      <div
        class="text-sm text-white/90 leading-relaxed font-medium description-content"
        v-html="description"
      ></div>
    </div>
  </transition>
</template>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.description-content :deep(br) {
  display: block;
  content: '';
  margin-top: 4px;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
