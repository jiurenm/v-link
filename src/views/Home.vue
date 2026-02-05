<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore, type Track } from '@/stores/player'
import NavBar from '@/components/common/NavBar.vue'
import GlobalTopTrends from '@/components/home/GlobalTopTrends.vue'
import GroupImmersiveZone from '@/components/home/GroupImmersiveZone.vue'
import RecentlyUpdated from '@/components/home/RecentlyUpdated.vue'
import { fetchTracks } from '@/services/dataService'
import { useUIStore } from '@/stores/ui'

defineOptions({
  name: 'HomePage',
})

const router = useRouter()
const playerStore = usePlayerStore()
const uiStore = useUIStore()

// 团体颜色映射
const groupColors: Record<string, string> = {
  '25時、ナイトコードで。': '#884499',
  'Leo/need': '#4455dd',
  'MORE MORE JUMP！': '#88dd44',
  'Vivid BAD SQUAD': '#ee1166',
  'ワンダーランズ×ショウタイム': '#ff9900',
  'Virtual Singer': '#39C5BB',
}

// 团体背景光位置映射
const groupGlowPositions: Record<string, 'left' | 'right'> = {
  '25時、ナイトコードで。': 'right',
  'Leo/need': 'right',
  'MORE MORE JUMP！': 'left',
  'Vivid BAD SQUAD': 'right',
  'ワンダーランズ×ショウタイム': 'left',
  'Virtual Singer': 'left',
}

const allTracks = ref<Track[]>([])
const topTrends = ref<Track[]>([])
const recentlyUpdated = ref<Track[]>([])
const groupTracks = ref<Record<string, Track[]>>({})

// 从正式数据初始化
onMounted(async () => {
  const tracks = await fetchTracks()
  allTracks.value = tracks

  // 按总播放量排序，取前9首作为热门榜单
  topTrends.value = [...tracks]
    .sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
    .slice(0, 9)

  // 按 updated_at 排序，取前 12 首作为最近更新
  recentlyUpdated.value = [...tracks]
    .sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0))
    .slice(0, 12)

  // 按团体分组（排除 Other）
  const grouped: Record<string, Track[]> = {}
  tracks.forEach((track) => {
    const group = track.pjsk_meta?.main_group
    if (group && group !== 'Other') {
      if (!grouped[group]) {
        grouped[group] = []
      }
      grouped[group].push(track)
    }
  })

  // 每个团体取前6首
  Object.keys(grouped).forEach((group) => {
    const tracks = grouped[group]
    if (tracks && Array.isArray(tracks)) {
      groupTracks.value[group] = tracks.slice(0, 6)
    }
  })
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

// 获取排序后的团体列表
const sortedGroups = computed(() => {
  const priority = [
    'Virtual Singer',
    'Leo/need',
    'MORE MORE JUMP！',
    'Vivid BAD SQUAD',
    'ワンダーランズ×ショウタイム',
    '25時、ナイトコードで。',
  ]
  // 只返回在 priority 中定义的团体，并按顺序排列
  return priority.filter((group) => groupTracks.value[group] && groupTracks.value[group].length > 0)
})
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f] text-white pb-24">
    <NavBar />

    <!-- 全站热门榜单 -->
    <GlobalTopTrends
      :tracks="topTrends"
      @track-click="goToPlayer"
      @track-play="goToPlayer"
      @track-add="(id, event) => goToPlayer(id, true, event)"
    />

    <!-- 最近更新 -->
    <RecentlyUpdated
      :tracks="recentlyUpdated"
      @track-click="goToPlayer"
      @track-play="goToPlayer"
      @track-add="(id, event) => goToPlayer(id, true, event)"
    />

    <!-- 团体沉浸式分区 -->
    <GroupImmersiveZone
      v-for="groupName in sortedGroups"
      :key="groupName"
      :group-name="groupName"
      :tracks="groupTracks[groupName] || []"
      :glow-color="groupColors[groupName] || '#888888'"
      :glow-position="groupGlowPositions[groupName] || 'left'"
      @track-click="goToPlayer"
      @track-play="goToPlayer"
      @track-add="(id, event) => goToPlayer(id, true, event)"
    />
  </div>
</template>
