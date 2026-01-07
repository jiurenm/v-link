<script setup lang="ts">
import { ref, computed } from 'vue'
import thumbImage from '@/assets/images/thumb.png'
import { formatTime } from '@/utils/format'

interface Props {
  progress: number // 0-100
  currentTime: number
  duration: number
  isPlaying?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isPlaying: false,
})

const emit = defineEmits<{
  seek: [time: number]
}>()

const sliderRef = ref<HTMLDivElement>()
const isDragging = ref(false)

const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  handleSeek(e)
}

const handleMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    handleSeek(e)
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleSeek = (e: MouseEvent) => {
  if (!sliderRef.value) return
  const rect = sliderRef.value.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const newTime = percent * props.duration
  emit('seek', newTime)
}

// 计算滑块位置
const thumbPosition = computed(() => {
  return `${props.progress}%`
})

// 计算已播放部分的渐变（初音绿主题色）
const playedGradient = computed(() => {
  // 使用初音绿主题色，创建渐变效果
  return `linear-gradient(to right, 
    #39c5bb 0%, 
    #66cfc9 50%, 
    #39c5bb 100%)`
})
</script>

<template>
  <div class="leek-slider-container">
    <div
      ref="sliderRef"
      class="relative h-1 cursor-pointer group"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <!-- 进度条背景（未播放部分 - 半透明，减薄到2-4px） -->
      <div class="absolute inset-0 h-full bg-white/10 rounded-full" />

      <!-- 已播放部分（初音绿渐变 + 发光效果） -->
      <div
        class="absolute inset-y-0 left-0 h-full rounded-full transition-all duration-100"
        :style="{
          width: `${progress}%`,
          background: playedGradient,
          boxShadow:
            '0 0 12px rgba(57, 197, 187, 0.6), 0 0 24px rgba(57, 197, 187, 0.4), 0 0 36px rgba(57, 197, 187, 0.2)',
        }"
      />

      <!-- 葱形滑块 -->
      <div
        class="absolute top-1/2 -translate-y-1/2 transition-all duration-100 cursor-grab active:cursor-grabbing"
        :style="{
          left: `calc(${thumbPosition} - 12px)`,
        }"
      >
        <img
          :src="thumbImage"
          alt="进度滑块"
          class="w-6 h-6 drop-shadow-lg transition-transform leek-thumb"
          :class="{ 'scale-110': isDragging, 'leek-breathing': isPlaying && !isDragging }"
        />
      </div>
    </div>

    <!-- 时间显示 -->
    <div class="flex items-center justify-between text-xs text-white/60 mt-2">
      <span>{{ formatTime(currentTime) }}</span>
      <span>{{ formatTime(duration) }}</span>
    </div>
  </div>
</template>

<style scoped>
.leek-slider-container {
  padding: 0.5rem 0;
}

.leek-breathing {
  animation: leekBreathe 2s ease-in-out infinite;
}

.leek-thumb.scale-110 {
  animation: none !important;
}

@keyframes leekBreathe {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}
</style>
