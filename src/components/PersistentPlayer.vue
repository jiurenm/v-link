<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '@/stores/player'
import DashPlayer from './player/DashPlayer.vue'

const playerStore = usePlayerStore()

// --- 状态与计算属性 ---

// 当前播放的歌曲
const track = computed(() => playerStore.currentTrack)
// 当前选中的版本
const currentVersion = computed(() => playerStore.currentVersion)
// 播放器是否处于激活状态（决定是否 Teleport）
const isPlayerActive = computed(() => playerStore.isPlayerActive)
// 播放状态
const isPlaying = computed(() => playerStore.isPlaying)
// 当前时间 (目标)
const currentTime = computed(() => playerStore.currentTime)
// 音量
const volume = computed(() => playerStore.volume)

// 判断是否是无MV模式
const isNoMVMode = computed(() => currentVersion.value === '无MV')

// 获取当前版本的数据
const currentVersionData = computed(() => {
  if (!track.value?.versions) return null
  if (isNoMVMode.value) {
    return track.value.versions[0] || null
  }
  return track.value.versions.find((v) => v.label === currentVersion.value)
})

// 判断是否应该使用DASH播放器（有bvid的情况）
const shouldUseDashPlayer = computed(() => {
  return !!currentVersionData.value?.bvid
})

// 获取当前版本的bvid
const currentBvid = computed(() => {
  return currentVersionData.value?.bvid || null
})

// 传统播放模式 URL (旧逻辑兼容)
const activeMediaUrl = computed(() => {
  if (!track.value) return null
  if (shouldUseDashPlayer.value) return null

  if (isNoMVMode.value) {
    const audioSource = track.value.versions?.[0]
    return audioSource?.videoUrl || null
  }
  return track.value.versions?.find((v) => v.label === currentVersion.value)?.videoUrl || null
})

// --- DOM 引用 ---
const videoRef = ref<HTMLVideoElement>()
const audioRef = ref<HTMLAudioElement>()
const dashPlayerRef = ref<InstanceType<typeof DashPlayer>>()

// --- 内部状态 ---
const localTime = ref(0)
const isDashLoading = ref(false)
const isSwitching = ref(false)
let rafId: number | null = null
let lastStoreSyncTime = 0
let isSeeking = false
let isChangingSource = false

// --- 方法 ---

// 获取当前活跃的媒体元素
const activeMediaRef = computed(() => (isNoMVMode.value ? audioRef.value : videoRef.value))

// 时间更新循环 (RAF)
const startUpdateLoop = () => {
  if (rafId) cancelAnimationFrame(rafId)

  const loop = () => {
    // 如果使用 DashPlayer，则由 DashPlayer 的回调驱动，这里不需要处理
    if (shouldUseDashPlayer.value) {
      // DashPlayer update moved to handleDashTimeUpdate
    } else {
      const el = activeMediaRef.value
      if (el && !el.paused && !isSeeking && !isChangingSource) {
        localTime.value = el.currentTime

        // 节流同步到 Store (每200ms)
        const now = performance.now()
        if (now - lastStoreSyncTime > 200) {
          playerStore.setCurrentTime(el.currentTime)
          lastStoreSyncTime = now
        }
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

// 媒体初始化 (传统模式)
const initMedia = async () => {
  if (shouldUseDashPlayer.value) return

  const el = activeMediaRef.value
  const url = activeMediaUrl.value

  if (!el || !url) return

  try {
    isChangingSource = true
    el.pause()
    el.load()

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject('Timeout'), 8000)
      el.onloadedmetadata = () => {
        clearTimeout(timeout)
        resolve()
      }
      el.onerror = () => reject('Load Error')
    })

    el.volume = volume.value
    el.currentTime = currentTime.value // 继承时间

    if (isPlaying.value) {
      await el.play().catch(() => console.warn('Autoplay blocked'))
    }
  } catch (err) {
    console.error('Media init failed:', err)
  } finally {
    isChangingSource = false
  }
}

// 事件处理
const handleEnded = () => {
  playerStore.nextTrack()
}

const handleDashTimeUpdate = (time: number) => {
  localTime.value = time
  playerStore.setCurrentTime(time)
}

const handleDashDurationChange = (duration: number) => {
  playerStore.setDuration(duration)
}

const handleDashLoading = (loading: boolean) => {
  isDashLoading.value = loading
}

// --- 监听器 ---

// URL 变化 (传统模式)
watch(
  [activeMediaUrl, isNoMVMode],
  async () => {
    if (!shouldUseDashPlayer.value) {
      await nextTick()
      await initMedia()
    }
  },
  { immediate: true },
)

// 播放状态变化
watch(
  isPlaying,
  (playing) => {
    if (shouldUseDashPlayer.value) return

    const el = activeMediaRef.value
    if (!el || isChangingSource) return

    if (playing) {
      el.play().catch(() => {})
      startUpdateLoop()
    } else {
      el.pause()
      stopUpdateLoop()
      playerStore.setCurrentTime(el.currentTime)
    }
  },
  { immediate: true },
)

// Seek 处理
watch(currentTime, (time) => {
  if (shouldUseDashPlayer.value) return

  const el = activeMediaRef.value
  if (!el || isChangingSource) return

  if (Math.abs(el.currentTime - time) > 1) {
    isSeeking = true
    el.currentTime = time
    localTime.value = time

    const onSeeked = () => {
      isSeeking = false
      el.removeEventListener('seeked', onSeeked)
    }
    el.addEventListener('seeked', onSeeked)
  }
})

// 音量处理
watch(volume, (v) => {
  if (activeMediaRef.value) activeMediaRef.value.volume = v
})

onMounted(() => {
  if (isPlaying.value && !shouldUseDashPlayer.value) {
    startUpdateLoop()
  }
})

onUnmounted(() => {
  stopUpdateLoop()
})
</script>

<template>
  <div class="persistent-player" style="display: none">
    <!-- Teleport 到 ImmersivePlayer 的目标容器 -->
    <!-- 注意：to 属性必须始终指向一个存在的元素，即使 disabled 为 true。
         因此我们在不激活时指向 'body'，激活时（此时 ImmersivePlayer 已挂载）指向目标容器。 -->
    <Teleport
      :to="isPlayerActive ? '#immersive-player-target' : 'body'"
      :disabled="!isPlayerActive"
    >
      <div class="w-full h-full relative">
        <!-- DASH 播放器模式 -->
        <DashPlayer
          v-if="shouldUseDashPlayer && !isNoMVMode"
          ref="dashPlayerRef"
          :bvid="currentBvid"
          :is-playing="isPlaying"
          :current-time="currentTime"
          :volume="volume"
          :audio-only="false"
          class="w-full h-full"
          :class="{ 'opacity-0': isSwitching || isDashLoading }"
          @timeupdate="handleDashTimeUpdate"
          @durationchange="handleDashDurationChange"
          @loading="handleDashLoading"
          @ended="handleEnded"
        />

        <!-- DASH 音频模式 -->
        <DashPlayer
          v-else-if="shouldUseDashPlayer && isNoMVMode"
          ref="dashPlayerRef"
          :bvid="currentBvid"
          :is-playing="isPlaying"
          :current-time="currentTime"
          :volume="volume"
          :audio-only="true"
          class="hidden"
          @timeupdate="handleDashTimeUpdate"
          @durationchange="handleDashDurationChange"
          @loading="handleDashLoading"
          @ended="handleEnded"
        />

        <!-- 传统视频播放模式 -->
        <video
          v-else-if="!isNoMVMode && activeMediaUrl"
          ref="videoRef"
          :src="activeMediaUrl"
          playsinline
          class="w-full h-full object-cover transition-opacity duration-700"
          :class="{ 'opacity-0': isSwitching || isChangingSource }"
          @ended="handleEnded"
        />

        <!-- 传统音频播放器 -->
        <audio
          v-if="isNoMVMode && activeMediaUrl && !shouldUseDashPlayer"
          ref="audioRef"
          :src="activeMediaUrl"
          class="hidden"
          @ended="handleEnded"
        />
      </div>
    </Teleport>
  </div>
</template>
