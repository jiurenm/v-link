<script setup lang="ts">
import type { Track } from '@/stores/player'

interface Props {
  groupName: string
  tracks: Track[]
  glowColor: string
  glowPosition: 'left' | 'right'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'track-click': [id: string]
  'track-play': [id: string]
  'track-add': [id: string, event: MouseEvent]
}>()

// 获取标签文本和颜色
const getTagInfo = (track: Track) => {
  const vocalistType = track.pjsk_meta?.vocalist_type
  if (vocalistType === 'Unit') {
    return {
      text: '#Unit',
      color: props.glowColor,
    }
  }
  // 可以根据需要添加其他类型
  return null
}

const handleCardClick = (track: Track) => {
  emit('track-click', track.id)
}

const handleCardPlay = (e: Event, track: Track) => {
  e.stopPropagation()
  emit('track-play', track.id)
}

const handleCardAdd = (e: MouseEvent, track: Track) => {
  e.stopPropagation()
  emit('track-add', track.id, e)
}
</script>

<template>
  <section class="relative mt-20 overflow-hidden" :style="{ '--shadow-color': `${glowColor}66` }">
    <!-- 动态背景光 -->
    <div
      class="absolute w-[600px] h-[600px] rounded-full filter blur-[120px] opacity-10 -z-10 pointer-events-none"
      :class="
        glowPosition === 'left' ? 'left-[-100px] top-[-100px]' : 'right-[-100px] top-[-100px]'
      "
      :style="{ background: glowColor }"
    ></div>

    <div class="px-6 max-w-7xl mx-auto">
      <!-- 标题区域 -->
      <div
        class="flex justify-between items-end mb-8"
        :class="glowPosition === 'right' ? 'flex-row-reverse' : ''"
      >
        <div :class="glowPosition === 'right' ? 'text-right' : ''">
          <h2 class="text-4xl font-black italic tracking-tighter" :style="{ color: glowColor }">
            {{ groupName }}
          </h2>
        </div>
        <a
          href="#"
          class="text-[10px] font-bold tracking-widest hover:underline transition-opacity opacity-60 hover:opacity-100"
          :style="{ color: glowColor }"
        >
          EXPLORE GROUP
        </a>
      </div>
    </div>

    <!-- 横向卡片流 - 独立容器以支持全宽滚动 -->
    <div class="px-6 max-w-7xl mx-auto overflow-hidden">
      <div
        class="flex gap-8 overflow-x-auto auto-hide-scrollbar py-4 scroll-smooth snap-x snap-mandatory touch-pan-x"
      >
        <div
          v-for="track in tracks"
          :key="track.id"
          class="group-card flex-none w-64 cursor-pointer snap-start"
          @click="handleCardClick(track)"
        >
          <div class="relative aspect-square rounded-[2.5rem] overflow-hidden">
            <img
              :src="track.cover"
              :alt="track.title"
              referrerpolicy="no-referrer"
              class="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
            />
            <!-- 底部40%渐变遮罩 -->
            <div
              class="absolute inset-0 flex flex-col justify-end p-8"
              style="
                background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 60%);
              "
            >
              <!-- 标签 -->
              <span
                v-if="getTagInfo(track)"
                class="text-[10px] font-mono mb-1"
                :style="{ color: getTagInfo(track)?.color }"
              >
                {{ getTagInfo(track)?.text }}
              </span>
              <!-- 歌名 -->
              <h3 class="text-xl font-bold text-white mb-1 line-clamp-2">{{ track.title }}</h3>
              <!-- P主 -->
              <p class="text-xs text-white/50 line-clamp-1">{{ track.artist }}</p>
            </div>
            <!-- Hover Play/Add Buttons -->
            <div
              class="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm"
            >
              <button
                class="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors shadow-lg"
                title="加入播放列表"
                @click.stop="handleCardAdd($event, track)"
              >
                <svg
                  class="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>
              <button
                class="w-14 h-14 rounded-full bg-emerald-400/90 backdrop-blur-sm flex items-center justify-center hover:bg-emerald-400 transition-colors shadow-lg"
                title="立即播放"
                @click.stop="handleCardPlay($event, track)"
              >
                <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.auto-hide-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.3s;
}

.auto-hide-scrollbar:hover {
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.auto-hide-scrollbar::-webkit-scrollbar {
  height: 8px;
}

.auto-hide-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.auto-hide-scrollbar::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 4px;
  transition: background 0.3s;
}

.auto-hide-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
}

.auto-hide-scrollbar:hover::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.group-card {
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}

.group-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px -10px var(--shadow-color);
}
</style>
