<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { usePlayerStore } from '@/stores/player'
import type { Track, VersionType } from '@/stores/player'
import DashPlayer from './DashPlayer.vue'

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

const playerStore = usePlayerStore()

// --- DOM 引用 ---
const canvasRef = ref<HTMLDivElement>()
const videoRef = ref<HTMLVideoElement>()
const audioRef = ref<HTMLAudioElement>()
const dashPlayerRef = ref<InstanceType<typeof DashPlayer>>()

// --- 响应式状态 ---
const localTime = ref(0) // 核心：用于驱动本地进度条/UI 的高频时间
const parallaxX = ref(0)
const parallaxY = ref(0)
const glitchProgress = ref(0)
const isDashLoading = ref(false)

// --- 内部变量 (非响应式，避免性能开销) ---
let rafId: number | null = null
let lastStoreSyncTime = 0
let isSeeking = false
let isChangingSource = false
let glitchInterval: number | null = null

// --- 计算属性 ---
const isNoMVMode = computed(() => props.currentVersion === '无MV')

// 获取当前版本的数据
const currentVersionData = computed(() => {
  if (!props.track?.versions) return null
  if (isNoMVMode.value) {
    // 无MV模式：使用2D版本的音频
    return props.track.versions.find((v) => v.type === '2D') || props.track.versions[0]
  }
  return props.track.versions.find((v) => v.type === props.currentVersion)
})

// 判断是否应该使用DASH播放器（有bvid的情况）
const shouldUseDashPlayer = computed(() => {
  return !!currentVersionData.value?.bvid
})

// 获取当前版本的bvid
const currentBvid = computed(() => {
  return currentVersionData.value?.bvid || null
})

// 计算当前应播放的资源 URL (用于旧的videoUrl模式)
const activeMediaUrl = computed(() => {
  if (!props.track) return null
  if (shouldUseDashPlayer.value) return null // 使用DASH播放器时不需要URL

  if (isNoMVMode.value) {
    // 无MV模式逻辑：尝试寻找2D资源获取音频，否则取列表第一个
    const audioSource =
      props.track.versions?.find((v) => v.type === '2D') || props.track.versions?.[0]
    return audioSource?.videoUrl || null
  }
  return props.track.versions?.find((v) => v.type === props.currentVersion)?.videoUrl || null
})

// 获取当前处于活跃状态的 DOM 元素
const activeMediaRef = computed(() => (isNoMVMode.value ? audioRef.value : videoRef.value))

const emit = defineEmits<{
  ended: []
}>()

// --- 核心方法：时间同步调度器 ---

const startUpdateLoop = () => {
  if (rafId) cancelAnimationFrame(rafId)

  const loop = () => {
    const el = activeMediaRef.value
    if (el && !el.paused && !isSeeking && !isChangingSource) {
      // 1. 高频更新本地值 (60fps)，用于组件内部渲染
      localTime.value = el.currentTime

      // 2. 节流更新 Store (每秒同步一次全局状态，减少渲染压力)
      const now = performance.now()
      if (now - lastStoreSyncTime > 200) {
        playerStore.setCurrentTime(el.currentTime)
        lastStoreSyncTime = now
      }
    }
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)
}

const stopUpdateLoop = () => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

// --- 媒体控制逻辑 ---

const handleEnded = () => {
  emit('ended')
}

const initMedia = async () => {
  // 如果使用DASH播放器，不需要初始化传统媒体元素
  if (shouldUseDashPlayer.value) {
    return
  }

  const el = activeMediaRef.value
  const url = activeMediaUrl.value

  if (!el || !url) return

  try {
    isChangingSource = true
    el.pause()
    el.load() // 强制重新加载资源

    // 等待元数据加载以获取正确的时间控制权
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject('Timeout'), 8000)
      el.onloadedmetadata = () => {
        clearTimeout(timeout)
        resolve()
      }
      el.onerror = () => reject('Load Error')
    })

    // 同步当前状态
    el.volume = playerStore.volume
    el.currentTime = props.currentTime // 继承切换前的时间点
    localTime.value = props.currentTime

    if (props.isPlaying) {
      await el.play().catch(() => console.warn('Autoplay blocked'))
    }
  } catch (err) {
    console.error('Media initialization failed:', err)
  } finally {
    isChangingSource = false
  }
}

// --- DASH 播放器事件处理 ---
const handleDashTimeUpdate = (time: number) => {
  localTime.value = time
  // DashPlayer 已经控制了更新频率(200ms)，这里直接更新 Store 即可，避免双重节流导致的时间混叠
  playerStore.setCurrentTime(time)
}

const handleDashDurationChange = (duration: number) => {
  playerStore.setDuration(duration)
}

const handleDashLoading = (loading: boolean) => {
  isDashLoading.value = loading
}

const handleDashError = (message: string) => {
  console.error('DASH播放器错误:', message)
}

// --- 监听器 ---

// 1. 监听 URL 变化（切换版本或歌曲）- 仅用于传统播放模式
watch(
  [activeMediaUrl, isNoMVMode],
  async () => {
    if (!shouldUseDashPlayer.value) {
      await nextTick() // 等待 v-if 切换 DOM
      await initMedia()
    }
  },
  { immediate: true },
)

// 2. 监听外部播放/暂停指令
watch(
  () => props.isPlaying,
  (playing) => {
    if (shouldUseDashPlayer.value) {
      // DASH播放器由props控制，不需要额外处理
      return
    }

    const el = activeMediaRef.value
    if (!el || isChangingSource) return

    if (playing) {
      el.play().catch(() => {})
      startUpdateLoop()
    } else {
      el.pause()
      stopUpdateLoop()
      playerStore.setCurrentTime(el.currentTime) // 暂停时同步最终精确时间
    }
  },
  { immediate: true },
)

// 3. 监听外部拖动进度条 (Seek)
watch(
  () => props.currentTime,
  (time) => {
    if (shouldUseDashPlayer.value) {
      // DASH播放器由props控制
      return
    }

    const el = activeMediaRef.value
    if (!el || isChangingSource) return

    // 只有当外部时间与本地媒体时间差异超过 1s 时（代表用户点击了进度条），才执行 seek
    if (Math.abs(el.currentTime - time) > 1) {
      isSeeking = true
      el.currentTime = time
      localTime.value = time

      // 监听 seek 完成
      const onSeeked = () => {
        isSeeking = false
        el.removeEventListener('seeked', onSeeked)
      }
      el.addEventListener('seeked', onSeeked)
    }
  },
)

// 4. 音量同步
watch(
  () => playerStore.volume,
  (v) => {
    if (activeMediaRef.value) activeMediaRef.value.volume = v
  },
)

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
    if (glitchInterval) clearInterval(glitchInterval)
    if (switching) {
      glitchProgress.value = 0
      glitchInterval = window.setInterval(() => {
        glitchProgress.value += 4.5
        if (glitchProgress.value >= 100) clearInterval(glitchInterval!)
      }, 50)
    }
  },
)

// --- 生命周期 ---

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove, { passive: true })
  if (props.isPlaying && !shouldUseDashPlayer.value) startUpdateLoop()

  // 处理移动端自动播放限制
  const unlock = () => {
    if (props.isPlaying && activeMediaRef.value?.paused) {
      activeMediaRef.value.play().catch(() => {})
    }
    document.removeEventListener('click', unlock)
  }
  document.addEventListener('click', unlock)
})

onUnmounted(() => {
  stopUpdateLoop()
  window.removeEventListener('mousemove', handleMouseMove)
  if (glitchInterval) clearInterval(glitchInterval)
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
      <!-- DASH 播放器模式 (bvid模式) -->
      <DashPlayer
        v-if="shouldUseDashPlayer && !isNoMVMode"
        ref="dashPlayerRef"
        :bvid="currentBvid"
        :is-playing="isPlaying"
        :current-time="currentTime"
        :volume="playerStore.volume"
        :audio-only="false"
        class="w-full h-full"
        :class="{ 'opacity-0': isSwitching || isDashLoading }"
        @timeupdate="handleDashTimeUpdate"
        @durationchange="handleDashDurationChange"
        @loading="handleDashLoading"
        @error="handleDashError"
        @ended="handleEnded"
      />

      <!-- DASH 音频模式 (无MV模式，使用2D版本的bvid) -->
      <DashPlayer
        v-else-if="shouldUseDashPlayer && isNoMVMode"
        ref="dashPlayerRef"
        :bvid="currentBvid"
        :is-playing="isPlaying"
        :current-time="currentTime"
        :volume="playerStore.volume"
        :audio-only="true"
        class="hidden"
        @timeupdate="handleDashTimeUpdate"
        @durationchange="handleDashDurationChange"
        @loading="handleDashLoading"
        @error="handleDashError"
        @ended="handleEnded"
      />

      <!-- 传统视频播放模式 (videoUrl模式) -->
      <video
        v-else-if="!isNoMVMode && activeMediaUrl"
        ref="videoRef"
        :key="activeMediaUrl"
        :src="activeMediaUrl"
        playsinline
        class="w-full h-full object-cover transition-opacity duration-700"
        :class="{ 'opacity-0': isSwitching || isChangingSource }"
        @ended="handleEnded"
      />

      <!-- 无MV模式显示封面图 -->
      <img
        v-if="isNoMVMode && track?.cover"
        :src="track.cover"
        referrerpolicy="no-referrer"
        class="w-full h-full object-cover transition-opacity duration-700"
        :class="{ 'opacity-0': isSwitching || isChangingSource }"
      />
    </div>

    <!-- 传统音频播放器 (无MV模式，非bvid) -->
    <audio
      v-if="isNoMVMode && activeMediaUrl && !shouldUseDashPlayer"
      ref="audioRef"
      :src="activeMediaUrl"
      class="hidden"
      @ended="handleEnded"
    />

    <Transition name="fade">
      <div
        v-if="isSwitching || isChangingSource || isDashLoading"
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
