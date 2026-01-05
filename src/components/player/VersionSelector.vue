<script setup lang="ts">
import { computed } from 'vue'
import type { Track } from '@/stores/player'

interface Props {
  track: Track | null
  currentVersion: '2D' | '3D'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'version-change': [version: '2D' | '3D']
}>()

const availableVersions = computed(() => {
  // 只有 PJSK 歌曲且有多个版本时才显示版本选择器
  if (!props.track?.is_pjsk || !props.track?.versions || props.track.versions.length <= 1) {
    return []
  }
  return props.track.versions.map((v) => v.type)
})

// 是否应该显示版本选择器
const shouldShow = computed(() => {
  return props.track?.is_pjsk === true && availableVersions.value.length > 1
})

const handleVersionClick = (version: '2D' | '3D') => {
  if (version === props.currentVersion) return

  // 触觉反馈（移动端）
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }

  // 8-bit 点击音（可选，需要音频文件）
  // 这里暂时用 Web Audio API 生成一个简单的音调
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      const audioContext = new AudioContextClass()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'square'
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.01)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.01)
    }
  } catch {
    // 忽略音频错误
  }

  emit('version-change', version)
}
</script>

<template>
  <div v-if="shouldShow" class="version-selector flex items-center justify-center gap-2 mb-1">
    <button
      v-for="version in availableVersions"
      :key="version"
      @click="handleVersionClick(version)"
      :class="[
        'version-button relative px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300',
        'backdrop-blur-md border',
        currentVersion === version
          ? 'bg-primary/40 text-white border-primary/60 shadow-lg shadow-primary/50 scale-105'
          : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/80 hover:border-white/20',
      ]"
    >
      <span class="relative z-10">{{ version }}</span>

      <!-- 金属感发光效果 -->
      <div
        v-if="currentVersion === version"
        class="absolute inset-0 rounded-md bg-gradient-to-b from-primary/30 to-primary/10"
        style="
          box-shadow:
            0 0 12px rgba(57, 197, 187, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        "
      />
      <div
        v-if="currentVersion === version"
        class="absolute inset-0 rounded-md border border-primary/60"
        style="box-shadow: 0 0 8px rgba(57, 197, 187, 0.4)"
      />
    </button>
  </div>
</template>

<style scoped>
.version-button {
  min-width: 60px;
}
</style>
