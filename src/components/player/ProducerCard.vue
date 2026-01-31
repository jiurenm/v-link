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
const previewImage = ref<string | null>(null)
const loadedImages = ref(new Set<string>())

function onImageLoad(url: string) {
  loadedImages.value.add(url)
}

function openPreview(url: string) {
  // Try to get a larger version of the image
  // The square thumbnails usually contain '/c/250x250_80_a2/' or similar
  // We can try to remove the crop part to get a larger (but still master) version
  let largeUrl = url
  if (url.includes('pximg.net') || url.includes('pixiv.re')) {
    // Basic replacement for common Pixiv thumbnail patterns to get master version
    // e.g. /c/250x250_80_a2/img-master/... -> /img-master/...
    largeUrl = url.replace(/\/c\/\d+x\d+[^/]+\//, '/')
  }
  previewImage.value = largeUrl
}
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
            class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/50 relative shrink-0"
          >
            <img
              v-if="producer.avatar"
              :src="producer.avatar"
              :alt="producer.name"
              referrerpolicy="no-referrer"
              class="w-full h-full object-cover transition-opacity duration-500"
              :class="loadedImages.has(producer.avatar) ? 'opacity-100' : 'opacity-0'"
              @load="onImageLoad(producer.avatar)"
            />
            <div v-else class="text-2xl text-primary">{{ producer.name[0] }}</div>
            <!-- 加载占位 -->
            <div
              v-if="producer.avatar && !loadedImages.has(producer.avatar)"
              class="absolute inset-0 skeleton"
            />
          </div>
          <div>
            <div class="text-white font-bold text-lg truncate">{{ producer.name }}</div>
            <div class="text-white/60 text-sm">
              {{ props.type === 'producer' ? 'P主' : '画师' }}
            </div>
          </div>
        </div>

        <!-- P主的的热门作品 -->
        <div v-if="props.type === 'producer'">
          <div v-if="producer.topSongs && producer.topSongs.length > 0" class="space-y-3">
            <div class="text-white/80 text-sm font-medium mb-2">热门作品</div>
            <div
              v-for="(song, index) in producer.topSongs"
              :key="song.id"
              class="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
            >
              <div
                class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 relative"
              >
                <img
                  :src="song.cover"
                  :alt="song.title"
                  referrerpolicy="no-referrer"
                  class="w-full h-full object-cover transition-opacity duration-500"
                  :class="loadedImages.has(song.cover) ? 'opacity-100' : 'opacity-0'"
                  @load="onImageLoad(song.cover)"
                />
                <div v-if="!loadedImages.has(song.cover)" class="absolute inset-0 skeleton" />
              </div>
              <div class="flex-1 min-w-0">
                <div
                  class="text-white text-sm font-medium truncate group-hover:text-primary transition-colors"
                >
                  {{ song.title }}
                </div>
                <div class="text-white/50 text-xs mt-0.5">#{{ index + 1 }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-white/40 text-sm text-center py-4">暂无作品信息</div>
        </div>

        <!-- 画师的精选画作 -->
        <div v-else-if="props.type === 'illustrator'">
          <div v-if="producer.topWorks && producer.topWorks.length > 0">
            <div class="text-white/80 text-sm font-medium mb-3">精选画作 (Pixiv)</div>
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="work in producer.topWorks"
                :key="work.id"
                @click="openPreview(work.url)"
                class="aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-primary/50 transition-colors cursor-pointer group relative"
              >
                <img
                  :src="work.url"
                  :alt="work.title"
                  referrerpolicy="no-referrer"
                  class="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                  :class="loadedImages.has(work.url) ? 'opacity-100' : 'opacity-0'"
                  @load="onImageLoad(work.url)"
                />
                <div v-if="!loadedImages.has(work.url)" class="absolute inset-0 skeleton" />
                <div
                  class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="producer.topSongs && producer.topSongs.length > 0" class="space-y-3">
            <div class="text-white/80 text-sm font-medium mb-2">热门作品</div>
            <div
              v-for="(song, index) in producer.topSongs"
              :key="song.id"
              class="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div
                class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10"
              >
                <img
                  :src="song.cover"
                  :alt="song.title"
                  referrerpolicy="no-referrer"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-white text-sm font-medium truncate">{{ song.title }}</div>
                <div class="text-white/50 text-xs mt-0.5">#{{ index + 1 }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-white/40 text-sm text-center py-4">暂无作品信息</div>
        </div>

        <!-- 社交媒体链接 -->
        <div
          v-if="producer.links && producer.links.length > 0"
          class="mt-6 pt-4 border-t border-white/10"
        >
          <div class="text-white/80 text-sm font-medium mb-3">相关链接</div>
          <div class="flex flex-wrap gap-2">
            <a
              v-for="link in producer.links"
              :key="link.url"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3 py-1.5 rounded-full bg-white/5 hover:bg-primary/20 text-xs text-white/70 hover:text-primary transition-all border border-white/10 hover:border-primary/30"
            >
              {{ link.title || 'Link' }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 图片大图预览 -->
  <Transition name="preview">
    <div
      v-if="previewImage"
      class="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95 backdrop-blur-md"
      @click="previewImage = null"
    >
      <div class="relative max-w-4xl max-h-full">
        <img
          :src="previewImage"
          referrerpolicy="no-referrer"
          class="max-w-full max-h-[90vh] rounded-lg shadow-2xl border border-white/10 transition-opacity duration-300"
          :class="loadedImages.has(previewImage) ? 'opacity-100' : 'opacity-0'"
          @load="onImageLoad(previewImage)"
          @click.stop
        />
        <div
          v-if="!loadedImages.has(previewImage)"
          class="absolute inset-0 flex items-center justify-center"
        >
          <div
            class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"
          />
        </div>
        <button
          @click="previewImage = null"
          class="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10"
        >
          <span class="text-sm">关闭预览</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.card-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-leave-active {
  transition: all 0.3s ease-in;
}

.card-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.card-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.skeleton {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  background-color: rgba(255, 255, 255, 0.03);
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.preview-enter-active,
.preview-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.preview-enter-from,
.preview-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
