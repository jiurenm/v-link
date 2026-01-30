<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { getPlayUrls, getAudioUrl } from '@/utils/bilibili'

interface Props {
  bvid: string | null
  isPlaying: boolean
  currentTime: number
  audioOnly?: boolean // 无MV模式，只播放音频
  volume?: number
}

const props = withDefaults(defineProps<Props>(), {
  audioOnly: false,
  volume: 0.7,
})

const emit = defineEmits<{
  timeupdate: [time: number]
  durationchange: [duration: number]
  ended: []
  error: [message: string]
  loading: [isLoading: boolean]
}>()

// DOM 引用
const videoRef = ref<HTMLVideoElement>()
const audioRef = ref<HTMLAudioElement>()

// 状态
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')

// 当前流URL
const currentVideoUrl = ref('')
const currentAudioUrl = ref('')

// 内部状态
let isSeeking = false
let isChangingSource = false

// 同步参数
const SYNC_INTERVAL = 200 // 同步频率（ms）
const MAX_DRIFT = 0.6 // 超过这个直接 seek（秒）
const RATE_FACTOR = 0.15 // 调速强度（越小越平滑）

let syncTimer: number | null = null

// 初始化播放器
const initPlayer = async () => {
  if (!props.bvid) {
    isLoading.value = false
    return
  }

  isLoading.value = true
  hasError.value = false
  isChangingSource = true
  emit('loading', true)

  try {
    if (props.audioOnly) {
      // 无MV模式，只获取音频
      const audioInfo = await getAudioUrl(props.bvid)
      if (!audioInfo) {
        throw new Error('无法获取音频流')
      }
      currentAudioUrl.value = audioInfo.audioUrl
      emit('durationchange', audioInfo.duration)

      await nextTick()

      // 等待音频元素就绪
      if (audioRef.value) {
        audioRef.value.volume = props.volume

        // 等待加载
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('加载超时')), 15000)
          audioRef.value!.onloadedmetadata = () => {
            clearTimeout(timeout)
            resolve()
          }
          audioRef.value!.onerror = () => {
            clearTimeout(timeout)
            reject(new Error('音频加载失败'))
          }
        })

        if (props.isPlaying) {
          await audioRef.value.play().catch(() => {})
        }
      }
    } else {
      // 有MV模式，获取视频和音频
      const playInfo = await getPlayUrls(props.bvid)
      if (!playInfo) {
        throw new Error('无法获取播放地址')
      }

      currentVideoUrl.value = playInfo.videoUrl
      currentAudioUrl.value = playInfo.audioUrl
      emit('durationchange', playInfo.duration)

      await nextTick()

      // 等待视频和音频元素都就绪
      if (videoRef.value && audioRef.value) {
        videoRef.value.volume = 0 // 视频静音，只使用音频
        audioRef.value.volume = props.volume

        // 等待两个都加载完成
        await Promise.all([
          new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('视频加载超时')), 15000)
            videoRef.value!.onloadedmetadata = () => {
              clearTimeout(timeout)
              resolve()
            }
            videoRef.value!.onerror = () => {
              clearTimeout(timeout)
              reject(new Error('视频加载失败'))
            }
          }),
          new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('音频加载超时')), 15000)
            audioRef.value!.onloadedmetadata = () => {
              clearTimeout(timeout)
              resolve()
            }
            audioRef.value!.onerror = () => {
              clearTimeout(timeout)
              reject(new Error('音频加载失败'))
            }
          }),
        ])

        if (props.isPlaying) {
          await Promise.all([
            videoRef.value.play().catch(() => {}),
            audioRef.value.play().catch(() => {}),
          ])
          startSyncLoop()
        }
      }
    }
  } catch (error) {
    hasError.value = true
    errorMessage.value = error instanceof Error ? error.message : '播放失败'
    emit('error', errorMessage.value)
    console.error('播放器初始化失败:', error)
  } finally {
    isLoading.value = false
    isChangingSource = false
    emit('loading', false)
  }
}

// 同步视频和音频播放的循环
const startSyncLoop = () => {
  stopSyncLoop()

  syncTimer = window.setInterval(() => {
    if (
      props.audioOnly ||
      !audioRef.value ||
      !videoRef.value ||
      audioRef.value.paused ||
      isSeeking ||
      isChangingSource
    ) {
      return
    }

    const audio = audioRef.value
    const video = videoRef.value
    const diff = video.currentTime - audio.currentTime

    // ✅ 大偏差：直接校准
    if (Math.abs(diff) > MAX_DRIFT) {
      video.currentTime = audio.currentTime
      video.playbackRate = 1
      return
    }

    // ✅ 小偏差：通过播放速率慢慢拉回
    if (Math.abs(diff) > 0.05) {
      const rate = 1 - diff * RATE_FACTOR
      video.playbackRate = Math.min(1.05, Math.max(0.95, rate))
    } else {
      // 几乎同步，恢复正常速度
      video.playbackRate = 1
    }

    // 发射时间更新事件（以音频时间为准）
    emit('timeupdate', audio.currentTime)
  }, SYNC_INTERVAL)
}

const stopSyncLoop = () => {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }

  // 恢复正常播放速度
  if (videoRef.value) {
    videoRef.value.playbackRate = 1
  }
}

// 时间更新处理
const handleTimeUpdate = () => {
  if (props.audioOnly && audioRef.value && !isSeeking && !isChangingSource) {
    emit('timeupdate', audioRef.value.currentTime)
  }
}

// 播放结束处理
const handleEnded = () => {
  emit('ended')
}

// 监听 bvid 变化
watch(
  () => props.bvid,
  () => {
    stopSyncLoop()
    initPlayer()
  },
)

// 监听播放状态变化
watch(
  () => props.isPlaying,
  async (playing) => {
    if (isChangingSource) return

    if (props.audioOnly) {
      if (audioRef.value) {
        if (playing) {
          await audioRef.value.play().catch(() => {})
        } else {
          audioRef.value.pause()
        }
      }
    } else {
      if (videoRef.value && audioRef.value) {
        if (playing) {
          await Promise.all([
            videoRef.value.play().catch(() => {}),
            audioRef.value.play().catch(() => {}),
          ])
          startSyncLoop()
        } else {
          videoRef.value.pause()
          audioRef.value.pause()
          stopSyncLoop()
        }
      }
    }
  },
)

// 监听进度条拖动
watch(
  () => props.currentTime,
  (time) => {
    if (isChangingSource) return

    if (props.audioOnly) {
      if (audioRef.value && Math.abs(audioRef.value.currentTime - time) > 1) {
        isSeeking = true
        audioRef.value.currentTime = time

        const onSeeked = () => {
          isSeeking = false
          audioRef.value?.removeEventListener('seeked', onSeeked)
        }
        audioRef.value.addEventListener('seeked', onSeeked)
      }
    } else {
      if (videoRef.value && Math.abs(videoRef.value.currentTime - time) > 1) {
        isSeeking = true
        videoRef.value.currentTime = time
        if (audioRef.value) {
          audioRef.value.currentTime = time
        }

        const onSeeked = () => {
          isSeeking = false
          if (videoRef.value) videoRef.value.playbackRate = 1
          videoRef.value?.removeEventListener('seeked', onSeeked)
        }
        videoRef.value.addEventListener('seeked', onSeeked)
      }
    }
  },
)

// 监听音量变化
watch(
  () => props.volume,
  (vol) => {
    if (audioRef.value) {
      audioRef.value.volume = vol
    }
  },
)

onMounted(() => {
  initPlayer()
})

onUnmounted(() => {
  stopSyncLoop()
})

// 暴露给父组件的方法
defineExpose({
  play: async () => {
    if (props.audioOnly) {
      await audioRef.value?.play()
    } else {
      await Promise.all([videoRef.value?.play(), audioRef.value?.play()])
      startSyncLoop()
    }
  },
  pause: () => {
    if (props.audioOnly) {
      audioRef.value?.pause()
    } else {
      videoRef.value?.pause()
      audioRef.value?.pause()
      stopSyncLoop()
    }
  },
  seek: (time: number) => {
    if (props.audioOnly) {
      if (audioRef.value) audioRef.value.currentTime = time
    } else {
      if (videoRef.value) videoRef.value.currentTime = time
      if (audioRef.value) audioRef.value.currentTime = time
    }
  },
})
</script>

<template>
  <div class="dash-player relative w-full h-full">
    <!-- 视频元素 - 直接使用B站的URL，设置referrerpolicy来尝试绕过防盗链 -->
    <video
      v-show="!audioOnly && currentVideoUrl"
      ref="videoRef"
      :src="currentVideoUrl"
      class="w-full h-full object-contain"
      playsinline
      muted
      referrerpolicy="no-referrer"
      crossorigin="anonymous"
      @ended="handleEnded"
    />

    <!-- 音频元素 -->
    <audio
      v-if="currentAudioUrl"
      ref="audioRef"
      :src="currentAudioUrl"
      class="hidden"
      referrerpolicy="no-referrer"
      crossorigin="anonymous"
      @timeupdate="handleTimeUpdate"
      @ended="handleEnded"
    />

    <!-- 加载状态 -->
    <Transition name="fade">
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <div class="flex flex-col items-center gap-3">
          <div
            class="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"
          />
          <span class="text-white/60 text-sm">加载中...</span>
        </div>
      </div>
    </Transition>

    <!-- 错误状态 -->
    <Transition name="fade">
      <div
        v-if="hasError"
        class="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <div class="flex flex-col items-center gap-3 text-center px-4">
          <svg class="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span class="text-white/80 text-sm">{{ errorMessage }}</span>
          <button
            @click="initPlayer"
            class="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
