<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { Track, VersionType } from '@/stores/player'

interface Props {
  track: Track | null
  isPlaying: boolean
  currentVersion: VersionType
  isSwitching?: boolean
  currentTime?: number
}

const props = withDefaults(defineProps<Props>(), {
  isSwitching: false,
  currentTime: 0,
})

// --- DOM 引用 ---
const canvasRef = ref<HTMLDivElement>()

// --- 响应式状态 ---
const parallaxX = ref(0)
const parallaxY = ref(0)
const glitchProgress = ref(0)
const glitchInterval = ref<number | null>(null)

// --- 装饰性效果 (视差 & Glitch) ---

const handleMouseMove = (e: MouseEvent) => {
  if (!canvasRef.value) return
  const { left, top, width, height } = canvasRef.value.getBoundingClientRect()
  const x = (e.clientX - (left + width / 2)) / width
  const y = (e.clientY - (top + height / 2)) / height

  // 使用 CSS 变量或直接赋值
  parallaxX.value = x * 25
  parallaxY.value = y * 25
}

watch(
  () => props.isSwitching,
  (switching) => {
    if (glitchInterval.value) clearInterval(glitchInterval.value)
    if (switching) {
      glitchProgress.value = 0
      glitchInterval.value = window.setInterval(() => {
        glitchProgress.value += 4.5
        if (glitchProgress.value >= 100 && glitchInterval.value) {
          clearInterval(glitchInterval.value)
        }
      }, 50)
    }
  },
)

// --- 生命周期 ---

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  if (glitchInterval.value) clearInterval(glitchInterval.value)
})
</script>

<template>
  <div
    ref="canvasRef"
    class="canvas-area relative w-full h-full overflow-hidden rounded-xl"
    style="
      box-shadow:
        0 0 40px rgba(0, 0, 0, 0.8),
        0 20px 60px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(255, 255, 255, 0.05);
    "
  >
    <!-- 模糊背景层 - 用于填充黑边 -->
    <div
      v-if="track?.cover"
      class="absolute inset-0 -z-10"
      :style="{
        backgroundImage: `url(${track.cover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(20px) brightness(0.5)',
        transform: 'scale(1.1)',
      }"
    >
      <!-- 隐藏的预加载图片，确保使用正确的 referrer policy -->
      <img :src="track.cover" referrerpolicy="no-referrer" class="hidden" alt="" />
    </div>

    <div
      class="absolute inset-0 transition-transform duration-100 ease-out"
      :style="{
        transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0) scale(1.12)`,
        willChange: 'transform',
      }"
    >
      <!-- Teleport Target -->
      <div id="immersive-player-target" class="w-full h-full relative z-10"></div>

      <!-- 无MV模式显示封面图 (仅作为备用的视觉层，实际播放器在 PersistentPlayer) -->
      <img
        v-if="currentVersion === '无MV' && track?.cover"
        :src="track.cover"
        referrerpolicy="no-referrer"
        class="w-full h-full object-cover absolute inset-0 -z-10"
        :class="{ 'opacity-0': isSwitching }"
      />
    </div>

    <!-- 传统音频播放器 (无MV模式，非bvid) - 已移动到 PersistentPlayer -->

    <Transition name="fade">
      <div
        v-if="isSwitching"
        class="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-md"
      >
        <div class="text-center">
          <div class="glitch-text text-5xl font-mono text-[#39c5bb] mb-2">
            {{ Math.floor(glitchProgress) }}%
          </div>
          <div class="text-[10px] tracking-[0.2em] text-white/40 uppercase">
            Initialising Link...
          </div>
        </div>
      </div>
    </Transition>

    <div class="absolute inset-0 pointer-events-none bg-radial-gradient" />
    <div
      class="absolute bottom-0 left-0 right-0 h-40 pointer-events-none bg-gradient-to-t from-black/60 via-black/20 to-transparent"
    />
  </div>
</template>

<style scoped>
.bg-radial-gradient {
  background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%);
}

.glitch-text {
  animation: glitch 0.4s infinite;
  text-shadow:
    2px 0 #ff00ff,
    -2px 0 #00ffff;
}

@keyframes glitch {
  0% {
    transform: translate(0);
  }

  20% {
    transform: translate(-2px, 1px);
  }

  40% {
    transform: translate(-1px, -1px);
  }

  60% {
    transform: translate(2px, 2px);
  }

  80% {
    transform: translate(1px, -2px);
  }

  100% {
    transform: translate(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
