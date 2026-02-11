<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePlayerStore, type Track } from '@/stores/player'
import { useUIStore } from '@/stores/ui'
import NavBar from '@/components/common/NavBar.vue'
import ExploreFilterBar, { type SortMode } from '@/components/explore/ExploreFilterBar.vue'
import ExploreGrid from '@/components/explore/ExploreGrid.vue'
import { fetchTracks } from '@/services/dataService'

defineOptions({
  name: 'ExplorePage',
})

const router = useRouter()
const route = useRoute()
const playerStore = usePlayerStore()
const uiStore = useUIStore()

const hasPlayer = computed(() => !!playerStore.currentTrack)

const allTracks = ref<Track[]>([])
const isLoading = ref(true)

// 筛选状态
const searchQuery = ref('')
const activeGroup = ref('')
const activeSort = ref<SortMode>('views-desc')
const activeVersionType = ref('')

onMounted(async () => {
  // 从 URL query 读取初始团体筛选
  const groupFromQuery = route.query.group as string | undefined
  if (groupFromQuery) {
    activeGroup.value = groupFromQuery
  }

  isLoading.value = true
  try {
    allTracks.value = await fetchTracks()
  } finally {
    setTimeout(() => {
      isLoading.value = false
    }, 300)
  }
})

// 筛选 + 排序 计算属性
const filteredTracks = computed(() => {
  let result = [...allTracks.value]

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q),
    )
  }

  // 团体过滤
  if (activeGroup.value) {
    result = result.filter((t) => t.pjsk_meta?.main_group === activeGroup.value)
  }

  // 版本类型过滤
  if (activeVersionType.value) {
    result = result.filter((t) => t.versions?.some((v) => v.type === activeVersionType.value))
  }

  // 排序
  switch (activeSort.value) {
    case 'views-desc':
      result.sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
      break
    case 'views-asc':
      result.sort((a, b) => (a.total_views || 0) - (b.total_views || 0))
      break
    case 'updated':
      result.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0))
      break
    case 'title':
      result.sort((a, b) => a.title.localeCompare(b.title))
      break
  }

  return result
})

const goToPlayer = (id: string, onlyQueue = false, event?: MouseEvent) => {
  const targetTrack = allTracks.value.find((track) => track.id === id)
  if (!targetTrack) return

  if (onlyQueue) {
    playerStore.addToQueue(targetTrack)
    if (event) {
      uiStore.addFlyItem({
        x: event.clientX,
        y: event.clientY,
        image: targetTrack.cover,
      })
    }
    return
  }

  playerStore.playTrackNow(targetTrack)
  router.push({ name: 'player', params: { id } })
}

// 回到顶部
const showBackTop = ref(false)
const onScroll = () => {
  showBackTop.value = window.scrollY > 400
}
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f] text-white pb-24">
    <NavBar />

    <!-- 页面标题区 -->
    <header class="explore-header">
      <div class="header-glow"></div>
      <div class="max-w-7xl mx-auto px-6 relative z-10">
        <h1 class="page-title">
          EXPLORE
          <span class="title-accent">.</span>
        </h1>
        <p class="page-subtitle">发现所有歌曲，按团体、类型和播放量自由探索</p>
      </div>
    </header>

    <Transition name="fade" mode="out-in">
      <div v-if="isLoading" class="flex items-center justify-center min-h-[60vh]">
        <div class="flex flex-col items-center gap-4">
          <div
            class="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"
          ></div>
          <div class="text-white/50 text-sm animate-pulse">Loading tracks...</div>
        </div>
      </div>

      <div v-else class="max-w-7xl mx-auto px-6 py-8">
        <!-- 筛选栏 -->
        <ExploreFilterBar
          :total-count="allTracks.length"
          :filtered-count="filteredTracks.length"
          :initial-group="activeGroup"
          @update:search="(v) => (searchQuery = v)"
          @update:group="(v) => (activeGroup = v)"
          @update:sort="(v) => (activeSort = v)"
          @update:version-type="(v) => (activeVersionType = v)"
        />

        <!-- 歌曲网格 -->
        <div class="mt-8">
          <ExploreGrid
            :tracks="filteredTracks"
            @track-click="goToPlayer"
            @track-play="goToPlayer"
            @track-add="(id, event) => goToPlayer(id, true, event)"
          />
        </div>
      </div>
    </Transition>

    <!-- 回到顶部按钮 -->
    <Transition name="back-top">
      <button
        v-if="showBackTop"
        @click="scrollToTop"
        class="back-top-btn"
        :class="{ 'has-player': hasPlayer }"
        title="回到顶部"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.explore-header {
  position: relative;
  padding: 48px 0 32px;
  overflow: hidden;
}

.header-glow {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 300px;
  background: radial-gradient(ellipse, rgba(57, 197, 187, 0.12) 0%, transparent 70%);
  pointer-events: none;
}

.page-title {
  font-size: 48px;
  font-weight: 900;
  letter-spacing: -0.04em;
  font-style: italic;
  color: white;
  line-height: 1;
  margin-bottom: 12px;
}

.title-accent {
  color: #39c5bb;
}

.page-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.02em;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.back-top-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(57, 197, 187, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 50;
  backdrop-filter: blur(8px);
}

.back-top-btn:hover {
  background: #39c5bb;
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(57, 197, 187, 0.4);
}

.back-top-btn.has-player {
  bottom: 112px;
  /* 32px + 80px (player bar height) */
}

.back-top-enter-active,
.back-top-leave-active {
  transition: all 0.3s ease;
}

.back-top-enter-from,
.back-top-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
