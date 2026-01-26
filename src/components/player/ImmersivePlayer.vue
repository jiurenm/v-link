<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePlayerStore, type Track, type VersionType } from '@/stores/player'
import { extractDominantColor, generateGradient } from '@/utils/colorExtractor'
import CanvasArea from './CanvasArea.vue'
import VersionSelector from './VersionSelector.vue'
import LeekSlider from './LeekSlider.vue'
import StreamingLyrics from './StreamingLyrics.vue'
import LegendProgress from './LegendProgress.vue'
import ProducerCard from './ProducerCard.vue'
import SongDescription from './SongDescription.vue'
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
const blurredCoverUrl = ref<string | null>(null)

// 移动端下滑手势
const touchStartY = ref(0)
const touchCurrentY = ref(0)
const isDragging = ref(false)
const dragOffset = ref(0)
const playerRef = ref<HTMLElement | null>(null)

// 39 模式检测
const is39Mode = ref(false)
let neonFlashTimeout: number | null = null

// 计算当前版本
const currentVersion = computed(() => playerStore.currentVersion)

// 根据组合名称返回对应的颜色
const groupColor = computed(() => {
  const group = props.track?.pjsk_meta?.main_group
  if (!group) return '#39c5bb' // 默认 primary 色

  const colorMap: Record<string, string> = {
    'Leo/need': 'var(--color-accent-blue)',
    'MORE MORE JUMP！': 'var(--color-accent-green)',
    'Vivid BAD SQUAD': 'var(--color-accent-pink)',
    'ワンダーランズ×ショウタイム': 'var(--color-accent-orange)',
    '25時、ナイトコードで。': 'var(--color-accent-purple)',
  }

  return colorMap[group] || '#39c5bb'
})

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

// 触发霓虹闪烁 - 增强版
const triggerNeonFlash = () => {
  // 给整个播放器添加强烈的霓虹边框效果
  if (playerRef.value) {
    playerRef.value.style.transition = 'box-shadow 0.2s ease-out, border 0.2s ease-out'
    playerRef.value.style.boxShadow =
      '0 0 80px rgba(57, 197, 187, 1), 0 0 160px rgba(57, 197, 187, 0.8), inset 0 0 60px rgba(57, 197, 187, 0.3)'
    playerRef.value.style.border = '2px solid rgba(57, 197, 187, 0.8)'
  }

  // 给 body 添加全局闪烁
  document.body.style.transition = 'box-shadow 0.2s ease-out'
  document.body.style.boxShadow =
    '0 0 150px rgba(57, 197, 187, 0.9), inset 0 0 120px rgba(57, 197, 187, 0.3)'

  if (neonFlashTimeout) {
    clearTimeout(neonFlashTimeout)
  }

  // 创建闪烁动画效果
  let flashCount = 0
  const flashInterval = setInterval(() => {
    flashCount++
    if (flashCount > 6) {
      // 闪烁6次后停止
      clearInterval(flashInterval)
      return
    }

    if (playerRef.value) {
      const intensity = flashCount % 2 === 0 ? 1 : 0.6
      playerRef.value.style.boxShadow = `0 0 ${80 * intensity}px rgba(57, 197, 187, ${intensity}), 0 0 ${160 * intensity}px rgba(57, 197, 187, ${intensity * 0.8}), inset 0 0 ${60 * intensity}px rgba(57, 197, 187, ${intensity * 0.3})`
    }
  }, 150)

  // 2秒后完全移除效果
  neonFlashTimeout = window.setTimeout(() => {
    clearInterval(flashInterval)
    if (playerRef.value) {
      playerRef.value.style.boxShadow = ''
      playerRef.value.style.border = ''
      playerRef.value.style.transition = ''
    }
    document.body.style.boxShadow = ''
    setTimeout(() => {
      document.body.style.transition = ''
    }, 300)
  }, 2000)
}

// 提取封面主色
const extractColor = async () => {
  if (!props.track?.cover) return

  try {
    const color = await extractDominantColor(props.track.cover)
    dominantColor.value = color
    backgroundGradient.value = generateGradient(color, 0.2)
    blurredCoverUrl.value = props.track.cover
  } catch (error) {
    console.warn('颜色提取失败:', error)
  }
}

// 版本切换处理（只有 PJSK 歌曲才支持）
const handleVersionChange = async (version: VersionType) => {
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
  // 移除进入动画，直接显示
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
      transform: isDragging ? `translateY(${dragOffset}px)` : '',
      opacity: isDragging ? Math.max(0.5, 1 - dragOffset / 400) : 1,
    }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- 模糊背景层 -->
    <div
      v-if="blurredCoverUrl"
      class="absolute inset-0 z-0"
      :style="{
        backgroundImage: `url(${blurredCoverUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(40px) brightness(0.4)',
        transform: 'scale(1.1)',
      }"
    >
      <!-- 隐藏的预加载图片，确保使用正确的 referrer policy -->
      <img :src="blurredCoverUrl" referrerpolicy="no-referrer" class="hidden" alt="" />
    </div>
    <div
      class="absolute inset-0 z-0"
      :style="{
        background: backgroundGradient,
        opacity: 0.6,
      }"
    />

    <!-- 三段式布局容器 -->
    <div class="relative z-10 flex flex-col pb-4" style="height: 100vh; box-sizing: border-box">
      <!-- A. Canvas Area (48% 高度) - 居中布局 -->
      <div
        class="flex-shrink-0 flex items-center justify-center px-4 pt-10 pb-3"
        style="height: 48vh"
      >
        <div class="flex items-center w-full max-w-7xl gap-4">
          <!-- 左侧厨力插件 -->
          <div class="hidden lg:flex flex-col items-center justify-center flex-shrink-0 w-64">
            <div
              v-if="track?.pjsk_meta?.main_group"
              class="glass-panel p-4 rounded-2xl flex flex-col items-center"
            >
              <span class="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Group</span>
              <div class="font-bold text-lg" :style="{ color: groupColor }">
                {{ track.pjsk_meta.main_group }}
              </div>
            </div>
          </div>

          <!-- 视频区域 - 居中 -->
          <div
            class="flex-1 mx-auto w-full"
            style="max-width: min(100%, calc(48vh * 16 / 9)); aspect-ratio: 16/9"
          >
            <CanvasArea
              :track="track"
              :is-playing="playerStore.isPlaying"
              :current-version="currentVersion"
              :is-switching="isSwitchingVersion"
              :current-time="playerStore.currentTime"
            />
          </div>

          <!-- 右侧厨力插件 -->
          <div class="hidden lg:flex flex-col items-center justify-center flex-shrink-0 w-64 gap-3">
            <a
              v-if="track?.voca_db_id"
              :href="`https://vocadb.net/S/${track.voca_db_id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="glass-widget px-4 py-2 rounded-lg text-center hover:bg-white/10 transition-colors"
            >
              <div class="text-xs text-white/40 mb-1">VocaDB</div>
              <div class="text-sm font-semibold text-primary">查看详情</div>
            </a>
            <div
              v-if="track?.pjsk_meta?.difficulty?.master"
              class="glass-panel p-4 rounded-2xl text-center"
            >
              <div class="text-[10px] text-gray-400 uppercase mb-1">Difficulty</div>
              <div class="text-3xl font-black text-white/90">
                {{ track.pjsk_meta.difficulty.master }}
              </div>
              <div class="text-[10px] text-white/40 tracking-widest">MASTER</div>
            </div>
          </div>
        </div>
      </div>

      <!-- B. The Switchboard (16% 高度) -->
      <div
        class="flex-shrink-0 flex flex-col items-center justify-center gap-4 px-4 py-2 mt-6"
        style="min-height: 16vh"
      >
        <!-- 版本选择器 - 半透明胶囊状，放在视频正下方 -->
        <VersionSelector
          v-if="track?.is_pjsk && track?.versions && track.versions.length > 1"
          :track="track"
          :current-version="currentVersion"
          @version-change="handleVersionChange"
        />

        <!-- 葱形进度条 -->
        <div class="w-full max-w-2xl px-4">
          <LeekSlider
            :progress="playerStore.progress"
            :current-time="playerStore.currentTime"
            :duration="playerStore.duration"
            :is-playing="playerStore.isPlaying"
            @seek="handleSeek"
          />
        </div>

        <!-- 播放控制 -->
        <PlaybackControls
          :is-playing="playerStore.isPlaying"
          :shuffle="playerStore.shuffle"
          :repeat="playerStore.repeat"
          size="medium"
          @play="togglePlay"
          @pause="togglePlay"
          @previous="playerStore.previousTrack()"
          @next="playerStore.nextTrack()"
          @toggle-shuffle="playerStore.toggleShuffle()"
          @toggle-repeat="playerStore.toggleRepeat()"
        />
      </div>

      <!-- C. Metadata & Leek Bar (36% 高度) -->
      <div class="flex-1 overflow-y-auto px-6 pt-6 scrollbar-hide" style="min-height: 0">
        <div class="max-w-2xl mx-auto space-y-8">
          <!-- 歌曲信息卡片 -->
          <div class="glass-card p-8 rounded-2xl text-center">
            <h2
              class="text-4xl font-bold text-white mb-6"
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

          <SongDescription :track="track" />

          <!-- 传说入进度条 -->
          <div v-if="track?.playCount" class="glass-card p-4 rounded-xl">
            <LegendProgress :play-count="track.playCount" />
          </div>

          <!-- 歌词流卡片 -->
          <div class="glass-card p-8 rounded-xl">
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

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.glass-widget {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 0.5px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.scrollbar-hide {
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari, Opera */
}
</style>
