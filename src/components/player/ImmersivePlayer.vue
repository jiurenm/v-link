<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { usePlayerStore, type Track } from '@/stores/player'
import { extractDominantColor, generateGradient } from '@/utils/colorExtractor'
import CanvasArea from './CanvasArea.vue'
import VersionSelector from './VersionSelector.vue'
import LeekSlider from './LeekSlider.vue'
import StreamingLyrics from './StreamingLyrics.vue'
import LegendProgress from './LegendProgress.vue'
import ProducerCard from './ProducerCard.vue'
import PlaybackControls from '@/components/common/PlaybackControls.vue'

interface Props {
  track: Track | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const playerStore = usePlayerStore()

// 状态管理
const isSwitchingVersion = ref(false)
const showProducerCard = ref(false)
const showIllustratorCard = ref(false)
const showTranslation = ref(false)
const dominantColor = ref({ r: 57, g: 197, b: 187 }) // 默认 primary 色
const backgroundGradient = ref('linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)')

// 移动端下滑手势
const touchStartY = ref(0)
const touchCurrentY = ref(0)
const isDragging = ref(false)
const dragOffset = ref(0)
const playerRef = ref<HTMLElement | null>(null)

// 进入动画
const isEntering = ref(true)

// 39 模式检测
const is39Mode = ref(false)
let neonFlashTimeout: number | null = null

// 计算当前版本
const currentVersion = computed(() => playerStore.currentVersion)

// 检测 39 模式
const check39Mode = (time: number) => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`

  if (timeStr === '3:09' || timeStr === '9:39' || timeStr === '0:39') {
    if (!is39Mode.value) {
      is39Mode.value = true
      triggerNeonFlash()
    }
  } else {
    is39Mode.value = false
  }
}

// 触发霓虹闪烁
const triggerNeonFlash = () => {
  document.body.style.transition = 'box-shadow 0.3s ease'
  document.body.style.boxShadow =
    '0 0 100px rgba(57, 197, 187, 0.8), inset 0 0 100px rgba(57, 197, 187, 0.2)'

  if (neonFlashTimeout) {
    clearTimeout(neonFlashTimeout)
  }

  neonFlashTimeout = window.setTimeout(() => {
    document.body.style.boxShadow = ''
    setTimeout(() => {
      document.body.style.transition = ''
    }, 300)
  }, 1000)
}

// 提取封面主色
const extractColor = async () => {
  if (!props.track?.cover) return

  try {
    const color = await extractDominantColor(props.track.cover)
    dominantColor.value = color
    backgroundGradient.value = generateGradient(color, 0.2)
  } catch (error) {
    console.warn('颜色提取失败:', error)
  }
}

// 版本切换处理（只有 PJSK 歌曲才支持）
const handleVersionChange = async (version: '2D' | '3D') => {
  if (!props.track?.is_pjsk || version === currentVersion.value) return

  isSwitchingVersion.value = true

  // 延迟切换以显示 Glitch 效果
  setTimeout(() => {
    playerStore.switchVersion(version)
    isSwitchingVersion.value = false

    // 检查是否需要对齐游戏片段
    const versionData = props.track?.versions?.find((v) => v.type === version)
    if (versionData && props.track && versionData.duration < props.track.duration) {
      if (playerStore.currentTime > versionData.duration) {
        // 可以显示提示
        console.log('已自动对齐游戏片段')
      }
    }
  }, 500)
}

// 进度条拖拽
const handleSeek = (time: number) => {
  playerStore.setCurrentTime(time)
  check39Mode(time)
}

// 播放控制
const togglePlay = () => {
  playerStore.togglePlay()
}

// 监听播放时间，检测 39 模式
watch(
  () => playerStore.currentTime,
  (time) => {
    check39Mode(time)
  },
)

// 监听当前歌曲变化
watch(
  () => props.track,
  () => {
    if (props.track) {
      extractColor()
      // 只有 PJSK 歌曲才设置默认版本
      if (props.track.is_pjsk && props.track.versions && props.track.versions.length > 0) {
        const defaultVersion = props.track.versions[0]?.type
        if (defaultVersion && defaultVersion !== currentVersion.value) {
          playerStore.switchVersion(defaultVersion)
        }
      }
    }
  },
  { immediate: true },
)

// 移动端下滑手势处理
const handleTouchStart = (e: TouchEvent) => {
  // 只在移动端启用
  if (window.innerWidth > 768) return
  if (e.touches.length !== 1) return

  const touch = e.touches[0]
  if (!touch) return

  // 检查是否从顶部区域开始滑动（前 100px）
  const startY = touch.clientY
  if (startY > 100) {
    // 不是从顶部开始，不处理
    return
  }

  touchStartY.value = startY
  isDragging.value = true
  dragOffset.value = 0
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value || window.innerWidth > 768) return
  if (e.touches.length !== 1) return

  const touch = e.touches[0]
  if (!touch) return

  touchCurrentY.value = touch.clientY
  const deltaY = touchCurrentY.value - touchStartY.value

  // 只允许向下滑动
  if (deltaY > 0) {
    dragOffset.value = deltaY
    e.preventDefault()
  }
}

const handleTouchEnd = () => {
  if (!isDragging.value || window.innerWidth > 768) return

  const threshold = 100 // 下滑超过 100px 时触发返回
  const velocity = dragOffset.value / 200 // 简单的速度计算

  if (dragOffset.value > threshold || velocity > 0.5) {
    // 添加关闭动画
    if (playerRef.value) {
      playerRef.value.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out'
      playerRef.value.style.transform = `translateY(100%)`
      playerRef.value.style.opacity = '0'
    }

    setTimeout(() => {
      emit('close')
    }, 300)
  } else {
    // 回弹动画
    if (playerRef.value) {
      playerRef.value.style.transition = 'transform 0.2s ease-out'
      playerRef.value.style.transform = 'translateY(0)'
    }
  }

  // 重置状态
  setTimeout(() => {
    isDragging.value = false
    dragOffset.value = 0
    if (playerRef.value) {
      playerRef.value.style.transition = ''
      playerRef.value.style.transform = ''
      playerRef.value.style.opacity = ''
    }
  }, 300)
}

onMounted(() => {
  extractColor()

  // 进入动画
  isEntering.value = true
  nextTick(() => {
    if (playerRef.value) {
      playerRef.value.style.transition =
        'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out'
      playerRef.value.style.transform = 'translateY(0)'
      playerRef.value.style.opacity = '1'
    }
    setTimeout(() => {
      isEntering.value = false
      if (playerRef.value) {
        playerRef.value.style.transition = ''
      }
    }, 400)
  })
})

onUnmounted(() => {
  if (neonFlashTimeout) {
    clearTimeout(neonFlashTimeout)
  }
})
</script>

<template>
  <div
    ref="playerRef"
    class="immersive-player fixed inset-0 z-40 overflow-hidden"
    :class="{ 'touch-none': isDragging }"
    :style="{
      background: backgroundGradient,
      transform: isDragging ? `translateY(${dragOffset}px)` : isEntering ? 'translateY(100%)' : '',
      opacity: isDragging ? Math.max(0.5, 1 - dragOffset / 400) : isEntering ? 0 : 1,
    }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- 三段式布局容器 -->
    <div class="h-full flex flex-col">
      <!-- A. Canvas Area (45% 高度) -->
      <div class="flex-shrink-0" style="height: 45vh">
        <CanvasArea
          :track="track"
          :is-playing="playerStore.isPlaying"
          :current-version="currentVersion"
          :is-switching="isSwitchingVersion"
          :current-time="playerStore.currentTime"
        />
      </div>

      <!-- B. The Switchboard (15% 高度) -->
      <div
        class="flex-shrink-0 flex flex-col items-center justify-center gap-3 px-4 py-2"
        style="min-height: 15vh"
      >
        <!-- 版本选择器 - 移到播放控制器上方，缩小尺寸 -->
        <VersionSelector
          v-if="track?.is_pjsk && track?.versions && track.versions.length > 1"
          :track="track"
          :current-version="currentVersion"
          @version-change="handleVersionChange"
        />

        <!-- 播放控制 -->
        <PlaybackControls
          :is-playing="playerStore.isPlaying"
          :shuffle="playerStore.shuffle"
          :repeat="playerStore.repeat"
          size="large"
          @play="togglePlay"
          @pause="togglePlay"
          @previous="playerStore.previousTrack()"
          @next="playerStore.nextTrack()"
          @toggle-shuffle="playerStore.toggleShuffle()"
          @toggle-repeat="playerStore.toggleRepeat()"
        />
      </div>

      <!-- C. Metadata & Leek Bar (40% 高度) -->
      <div class="flex-shrink-0 overflow-y-auto px-6 pb-6 pt-2" style="height: 40vh">
        <div class="max-w-2xl mx-auto space-y-6">
          <!-- 歌曲信息 -->
          <div class="text-center pt-2">
            <h2
              class="text-4xl font-bold text-white mb-2"
              style="
                text-shadow:
                  0 2px 8px rgba(0, 0, 0, 0.5),
                  0 0 20px rgba(57, 197, 187, 0.3);
              "
            >
              {{ track?.title || '未知歌曲' }}
            </h2>
            <div class="flex items-center justify-center gap-4 text-white/70">
              <span>{{ track?.artist || '未知艺术家' }}</span>
              <span v-if="track?.producer" class="text-primary/80">·</span>
              <button
                v-if="track?.producer"
                @click="showProducerCard = true"
                class="text-primary/80 hover:text-primary transition-colors"
              >
                {{ track.producer.name }}
              </button>
              <span v-if="track?.illustrator" class="text-white/40">·</span>
              <button
                v-if="track?.illustrator"
                @click="showIllustratorCard = true"
                class="text-white/60 hover:text-white transition-colors"
              >
                {{ track.illustrator.name }}
              </button>
            </div>
          </div>

          <!-- 传说入进度条 -->
          <LegendProgress v-if="track?.playCount" :play-count="track.playCount" />

          <!-- 葱形进度条 -->
          <div class="p-4">
            <LeekSlider
              :progress="playerStore.progress"
              :current-time="playerStore.currentTime"
              :duration="playerStore.duration"
              @seek="handleSeek"
            />
          </div>

          <!-- 歌词流 - 去掉背景色，直接浮在背景上 -->
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-white/60 font-medium text-sm">歌词</h3>
              <button
                v-if="track?.lyrics?.some((l) => l.translation)"
                @click="showTranslation = !showTranslation"
                class="text-xs text-primary/80 hover:text-primary transition-colors"
              >
                {{ showTranslation ? '隐藏翻译' : '显示翻译' }}
              </button>
            </div>
            <StreamingLyrics
              :track="track"
              :current-time="playerStore.currentTime"
              :show-translation="showTranslation"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- P主/画师 鸣谢卡 -->
    <ProducerCard
      v-if="showProducerCard && track?.producer"
      :producer="track.producer"
      type="producer"
      @close="showProducerCard = false"
    />
    <ProducerCard
      v-if="showIllustratorCard && track?.illustrator"
      :producer="track.illustrator"
      type="illustrator"
      @close="showIllustratorCard = false"
    />

    <!-- 移动端下滑提示 -->
    <div
      v-if="isDragging && dragOffset > 0"
      class="absolute top-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-sm flex items-center gap-2 pointer-events-none transition-opacity"
      :style="{ opacity: Math.min(1, dragOffset / 50) }"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
      <span>下滑返回</span>
    </div>

    <!-- 关闭按钮 - 仅在桌面端显示 -->
    <button
      @click="emit('close')"
      class="hidden sm:flex absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 transition-all items-center justify-center"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.immersive-player {
  /* 禁止使用纯白背景 */
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
}

/* 移除 glass-panel 样式，歌词区域不再使用背景 */

/* 39 模式霓虹边框效果 */
.immersive-player:has(+ .neon-active) {
  box-shadow: 0 0 50px rgba(57, 197, 187, 0.8);
}
</style>
