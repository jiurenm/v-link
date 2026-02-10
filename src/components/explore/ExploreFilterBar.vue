<script setup lang="ts">
import { ref, watch } from 'vue'

export type SortMode = 'views-desc' | 'views-asc' | 'updated' | 'title'

interface Props {
  totalCount: number
  filteredCount: number
  initialGroup?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:group': [value: string]
  'update:sort': [value: SortMode]
  'update:versionType': [value: string]
}>()

const searchQuery = ref('')
const activeGroup = ref(props.initialGroup || '')
const activeSort = ref<SortMode>('views-desc')
const activeVersionType = ref('')

// 防抖搜索
let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:search', val)
  }, 250)
})

const groups = [
  { label: 'Virtual Singer', color: '#39C5BB' },
  { label: 'Leo/need', color: '#4455dd' },
  { label: 'MORE MORE JUMP！', color: '#88dd44' },
  { label: 'Vivid BAD SQUAD', color: '#ee1166' },
  { label: 'ワンダーランズ×ショウタイム', color: '#ff9900' },
  { label: '25時、ナイトコードで。', color: '#884499' },
]

const sortOptions: { value: SortMode; label: string }[] = [
  { value: 'views-desc', label: '播放量 ↓' },
  { value: 'views-asc', label: '播放量 ↑' },
  { value: 'updated', label: '最近更新' },
  { value: 'title', label: '标题 A-Z' },
]

const versionTypes = [
  { label: '2D MV', value: '2D' },
  { label: '3D MV', value: '3D' },
]

const toggleGroup = (group: string) => {
  activeGroup.value = activeGroup.value === group ? '' : group
  emit('update:group', activeGroup.value)
}

const setSort = (sort: SortMode) => {
  activeSort.value = sort
  emit('update:sort', sort)
}

const toggleVersionType = (type: string) => {
  activeVersionType.value = activeVersionType.value === type ? '' : type
  emit('update:versionType', activeVersionType.value)
}
</script>

<template>
  <div class="explore-filter-bar">
    <!-- 搜索框 -->
    <div class="search-wrapper">
      <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索歌曲、艺术家..."
        class="search-input"
      />
      <button
        v-if="searchQuery"
        @click="
          searchQuery = ''
          emit('update:search', '')
        "
        class="clear-btn"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- 筛选区域 -->
    <div class="filters-section">
      <!-- 团体筛选 -->
      <div class="filter-row">
        <span class="filter-label">团体</span>
        <div class="filter-chips">
          <button
            v-for="group in groups"
            :key="group.label"
            @click="toggleGroup(group.label)"
            class="chip"
            :class="{ active: activeGroup === group.label }"
            :style="
              activeGroup === group.label
                ? {
                    backgroundColor: group.color + '20',
                    borderColor: group.color,
                    color: group.color,
                  }
                : {}
            "
          >
            <span class="chip-dot" :style="{ backgroundColor: group.color }"></span>
            {{ group.label }}
          </button>
        </div>
      </div>

      <!-- 版本类型筛选 -->
      <div class="filter-row">
        <span class="filter-label">类型</span>
        <div class="filter-chips">
          <button
            v-for="vt in versionTypes"
            :key="vt.value"
            @click="toggleVersionType(vt.value)"
            class="chip"
            :class="{ active: activeVersionType === vt.value }"
          >
            {{ vt.label }}
          </button>
        </div>

        <!-- 排序 -->
        <div class="sort-section">
          <span class="filter-label">排序</span>
          <div class="filter-chips">
            <button
              v-for="opt in sortOptions"
              :key="opt.value"
              @click="setSort(opt.value)"
              class="chip"
              :class="{ active: activeSort === opt.value }"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 结果统计 -->
    <div class="result-stats">
      <span class="stat-count">{{ filteredCount }}</span>
      <span class="stat-label"> / {{ totalCount }} 首歌曲</span>
    </div>
  </div>
</template>

<style scoped>
.explore-filter-bar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 16px;
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 14px 44px 14px 48px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  color: white;
  font-size: 15px;
  outline: none;
  transition: all 0.3s ease;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.search-input:focus {
  border-color: rgba(57, 197, 187, 0.4);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(57, 197, 187, 0.1);
}

.clear-btn {
  position: absolute;
  right: 12px;
  padding: 4px;
  color: rgba(255, 255, 255, 0.3);
  transition: color 0.2s;
  background: none;
  border: none;
  cursor: pointer;
}

.clear-btn:hover {
  color: rgba(255, 255, 255, 0.7);
}

.filters-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
  min-width: 36px;
  flex-shrink: 0;
}

.filter-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.chip:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.chip.active {
  background: rgba(57, 197, 187, 0.15);
  border-color: rgba(57, 197, 187, 0.4);
  color: #39c5bb;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sort-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
}

.result-stats {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
}

.stat-count {
  font-weight: 700;
  font-size: 18px;
  color: #39c5bb;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-weight: 400;
}

@media (max-width: 768px) {
  .sort-section {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    margin-top: 4px;
  }

  .filter-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
