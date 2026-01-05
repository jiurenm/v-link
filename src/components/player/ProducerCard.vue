<script setup lang="ts">
import { ref } from 'vue'
import type { Producer } from '@/stores/player'

interface Props {
  producer: Producer | null
  type?: 'producer' | 'illustrator'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'producer',
})

const emit = defineEmits<{
  close: []
}>()

const isVisible = ref(true)
</script>

<template>
  <Transition name="card">
    <div
      v-if="isVisible && producer"
      class="producer-card fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <!-- 背景遮罩 -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <!-- 卡片内容 -->
      <div
        class="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-primary/30 p-6 max-w-md w-full shadow-2xl"
        style="box-shadow: 0 0 40px rgba(57, 197, 187, 0.3)"
      >
        <!-- 关闭按钮 -->
        <button
          @click="emit('close')"
          class="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
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

        <!-- 头像和名称 -->
        <div class="flex items-center gap-4 mb-6">
          <div
            class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/50"
          >
            <img
              v-if="producer.avatar"
              :src="producer.avatar"
              :alt="producer.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="text-2xl text-primary">{{ producer.name[0] }}</div>
          </div>
          <div>
            <div class="text-white font-bold text-lg">{{ producer.name }}</div>
            <div class="text-white/60 text-sm">
              {{ props.type === 'producer' ? 'P主' : '画师' }}
            </div>
          </div>
        </div>

        <!-- 最火的三首歌 -->
        <div v-if="producer.topSongs && producer.topSongs.length > 0" class="space-y-3">
          <div class="text-white/80 text-sm font-medium mb-2">热门作品</div>
          <div
            v-for="(song, index) in producer.topSongs"
            :key="song.id"
            class="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
              <img :src="song.cover" :alt="song.title" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-white text-sm font-medium truncate">{{ song.title }}</div>
              <div class="text-white/50 text-xs mt-0.5">#{{ index + 1 }}</div>
            </div>
          </div>
        </div>
        <div v-else class="text-white/40 text-sm text-center py-4">暂无作品信息</div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.card-enter-active,
.card-leave-active {
  transition: opacity 0.3s ease;
}

.card-enter-from,
.card-leave-to {
  opacity: 0;
}
</style>
