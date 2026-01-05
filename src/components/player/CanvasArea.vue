<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Track } from '@/stores/player'

interface Props {
  track: Track | null
  isPlaying: boolean
  currentVersion: '2D' | '3D'
  isSwitching?: boolean
  currentTime?: number
}

const props = withDefaults(defineProps<Props>(), {
  isSwitching: false,
  currentTime: 0,
})

const canvasRef = ref<HTMLDivElement>()
const videoRef = ref<HTMLVideoElement>()
const audioRef = ref<HTMLAudioElement>()
const parallaxX = ref(0)
const parallaxY = ref(0)
const glitchProgress = ref(0)

// 计算当前版本的视频URL（只有 PJSK 歌曲才可能有视频）
const currentVideoUrl = computed(() => {
  if (!props.track?.is_pjsk || !props.track?.versions) return null
  const version = props.track.versions.find((v) => v.type === props.currentVersion)
  return version?.videoUrl || null
})

// 音频连续性：使用独立的audio元素
const audioUrl = computed(() => {
  // 如果有独立的音频URL，使用它；否则尝试从2D版本获取（通常2D版本包含完整音频）
  if (!props.track?.versions) return null
  const audioVersion = props.track.versions.find((v) => v.type === '2D')
  return audioVersion?.videoUrl || null
})

// 视差效果处理
let gyroHandler: ((e: DeviceOrientationEvent) => void) | null = null
let mouseHandler: ((e: MouseEvent) => void) | null = null

const handleParallax = (x: number, y: number) => {
  parallaxX.value = x * 0.02 // 微小的位移
  parallaxY.value = y * 0.02
}

onMounted(() => {
  // 陀螺仪支持（移动端）
  if (window.DeviceOrientationEvent) {
    gyroHandler = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        handleParallax(e.gamma, e.beta)
      }
    }
    window.addEventListener('deviceorientation', gyroHandler)
  }

  // 鼠标移动支持（桌面端）
  mouseHandler = (e: MouseEvent) => {
    if (canvasRef.value) {
      const rect = canvasRef.value.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const x = (e.clientX - centerX) / rect.width
      const y = (e.clientY - centerY) / rect.height
      handleParallax(x * 100, y * 100)
    }
  }
  window.addEventListener('mousemove', mouseHandler)
})

onUnmounted(() => {
  if (gyroHandler) {
    window.removeEventListener('deviceorientation', gyroHandler)
  }
  if (mouseHandler) {
    window.removeEventListener('mousemove', mouseHandler)
  }
})

// 同步视频和音频播放状态
watch(
  () => props.isPlaying,
  (playing) => {
    if (videoRef.value) {
      if (playing) {
        videoRef.value.play().catch(() => {
          // 忽略播放错误
        })
      } else {
        videoRef.value.pause()
      }
    }
    if (audioRef.value) {
      if (playing) {
        audioRef.value.play().catch(() => {
          // 忽略播放错误
        })
      } else {
        audioRef.value.pause()
      }
    }
  },
)

// 同步播放时间
watch(
  () => props.currentTime,
  (time) => {
    if (videoRef.value && Math.abs(videoRef.value.currentTime - time) > 0.5) {
      videoRef.value.currentTime = time
    }
    if (audioRef.value && Math.abs(audioRef.value.currentTime - time) > 0.5) {
      audioRef.value.currentTime = time
    }
  },
)

// Glitch 转场效果
watch(
  () => props.isSwitching,
  (switching) => {
    if (switching) {
      glitchProgress.value = 0
      const interval = setInterval(() => {
        glitchProgress.value += 3.9 // 39% 进度
        if (glitchProgress.value >= 100) {
          clearInterval(interval)
          glitchProgress.value = 0
        }
      }, 50)
    }
  },
)

// 版本切换时保持音频连续性
watch(
  () => props.currentVersion,
  () => {
    // 切换版本时，视频会重新加载，但音频继续播放
    if (audioRef.value && props.isPlaying) {
      // 音频已经在播放，不需要额外操作
    }
  },
)
</script>

<template>
  <div
    ref="canvasRef"
    class="canvas-area relative w-full overflow-hidden"
    :style="{ height: '45vh' }"
  >
    <!-- 背景层 - 封面/视频 -->
    <div
      class="absolute inset-0 transition-all duration-500"
      :style="{
        transform: `translate(${parallaxX}px, ${parallaxY}px) scale(1.1)`,
      }"
    >
      <!-- 视频播放器（静音，仅用于显示） -->
      <video
        v-if="currentVideoUrl"
        ref="videoRef"
        :src="currentVideoUrl"
        :muted="true"
        loop
        class="w-full h-full object-cover"
        :class="{ 'opacity-0': isSwitching }"
      />
      <!-- 封面图片 -->
      <img
        v-else-if="track?.cover"
        :src="track.cover"
        :alt="track.title"
        class="w-full h-full object-cover"
        :class="{ 'opacity-0': isSwitching }"
      />
    </div>

    <!-- 独立的音频播放器（用于音频连续性） -->
    <audio v-if="audioUrl" ref="audioRef" :src="audioUrl" loop preload="auto" class="hidden" />

    <!-- Glitch 占位符（切换时显示） -->
    <div
      v-if="isSwitching"
      class="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div class="text-center">
        <div class="text-6xl font-mono text-primary mb-4 glitch-text">
          {{ Math.floor(glitchProgress) }}%
        </div>
        <div class="text-white/60 text-sm">SEKAI 加载中...</div>
      </div>
    </div>

    <!-- 氛围光效果 -->
    <div
      class="absolute inset-0 pointer-events-none"
      :style="{
        background: `radial-gradient(circle at center, rgba(57, 197, 187, 0.2) 0%, transparent 70%)`,
      }"
    />

    <!-- 底部渐变遮罩 - 让图片消融在背景中 -->
    <div
      class="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
      :style="{
        background:
          'linear-gradient(to bottom, transparent 0%, rgba(10, 10, 10, 0.3) 50%, rgba(10, 10, 10, 0.8) 100%)',
      }"
    />
  </div>
</template>

<style scoped>
.glitch-text {
  animation: glitch 0.3s infinite;
  text-shadow:
    2px 0 #39c5bb,
    -2px 0 #ff00ff;
}

@keyframes glitch {
  0%,
  100% {
    transform: translate(0);
  }

  20% {
    transform: translate(-2px, 2px);
  }

  40% {
    transform: translate(-2px, -2px);
  }

  60% {
    transform: translate(2px, 2px);
  }

  80% {
    transform: translate(2px, -2px);
  }
}
</style>
