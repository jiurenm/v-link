<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  playCount: number
}

const props = defineProps<Props>()

// 传说入（100万）和殿堂入（10万）的阈值
const DENDOU_THRESHOLD = 100000 // 殿堂入
const DENSETSU_THRESHOLD = 1000000 // 传说入

const progress = computed(() => {
  if (props.playCount >= DENSETSU_THRESHOLD) {
    return 100
  } else if (props.playCount >= DENDOU_THRESHOLD) {
    // 已殿堂入，计算到传说入的进度
    return ((props.playCount - DENDOU_THRESHOLD) / (DENSETSU_THRESHOLD - DENDOU_THRESHOLD)) * 100
  } else {
    // 未殿堂入，计算到殿堂入的进度
    return (props.playCount / DENDOU_THRESHOLD) * 100
  }
})

const status = computed(() => {
  if (props.playCount >= DENSETSU_THRESHOLD) {
    return '传说入'
  } else if (props.playCount >= DENDOU_THRESHOLD) {
    return '殿堂入'
  } else {
    return '殿堂入まで'
  }
})

const targetCount = computed(() => {
  if (props.playCount >= DENSETSU_THRESHOLD) {
    return DENSETSU_THRESHOLD
  } else if (props.playCount >= DENDOU_THRESHOLD) {
    return DENSETSU_THRESHOLD
  } else {
    return DENDOU_THRESHOLD
  }
})
</script>

<template>
  <div v-if="playCount > 0" class="legend-progress">
    <div class="flex items-center justify-between text-xs mb-1">
      <span class="text-white/60">{{ status }}</span>
      <span class="text-white/60">
        {{ playCount.toLocaleString() }} / {{ targetCount.toLocaleString() }}
      </span>
    </div>
    <div class="relative h-1.5 bg-gray-800/60 rounded-full overflow-hidden">
      <div
        class="absolute inset-y-0 left-0 h-full bg-gradient-to-r from-primary via-accent-pink to-primary rounded-full transition-all duration-500"
        :style="{ width: `${Math.min(100, progress)}%` }"
      />
      <div
        class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
      />
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
</style>
