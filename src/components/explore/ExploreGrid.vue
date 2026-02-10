<script setup lang="ts">
import type { Track } from '@/stores/player'

interface Props {
  tracks: Track[]
}

defineProps<Props>()

const emit = defineEmits<{
  'track-click': [id: string]
  'track-play': [id: string]
  'track-add': [id: string, event: MouseEvent]
}>()

const groupColors: Record<string, string> = {
  '25時、ナイトコードで。': '#884499',
  'Leo/need': '#4455dd',
  'MORE MORE JUMP！': '#88dd44',
  'Vivid BAD SQUAD': '#ee1166',
  'ワンダーランズ×ショウタイム': '#ff9900',
  'Virtual Singer': '#39C5BB',
}

const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`
  }
  return views.toString()
}

const getGroupColor = (track: Track): string => {
  const group = track.pjsk_meta?.main_group
  if (!group) return 'rgba(255,255,255,0.15)'
  return groupColors[group] || 'rgba(255,255,255,0.15)'
}

const getGroupName = (track: Track): string => {
  return track.pjsk_meta?.main_group || ''
}

const getVersionTags = (track: Track): string[] => {
  if (!track.versions) return []
  const types = new Set(track.versions.map((v) => v.type))
  return Array.from(types)
}
</script>

<template>
  <!-- 空状态 -->
  <div v-if="tracks.length === 0" class="empty-state">
    <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <p class="empty-text">没有找到匹配的歌曲</p>
    <p class="empty-hint">尝试调整筛选条件</p>
  </div>

  <!-- 歌曲网格 -->
  <div v-else class="explore-grid">
    <div
      v-for="track in tracks"
      :key="track.id"
      class="track-card"
      @click="emit('track-click', track.id)"
    >
      <!-- 封面 -->
      <div class="card-cover">
        <img :src="track.cover" :alt="track.title" referrerpolicy="no-referrer" class="cover-img" />

        <!-- 团体色条 -->
        <div
          v-if="getGroupName(track)"
          class="group-stripe"
          :style="{ backgroundColor: getGroupColor(track) }"
        ></div>

        <!-- 播放量角标 -->
        <div class="views-badge">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {{ formatViews(track.total_views || 0) }}
        </div>

        <!-- 版本标签 -->
        <div class="version-tags">
          <span v-for="tag in getVersionTags(track)" :key="tag" class="version-tag">
            {{ tag }}
          </span>
        </div>

        <!-- Hover 遮罩 + 操作按钮 -->
        <div class="card-overlay">
          <button
            class="action-btn add-btn"
            title="加入播放列表"
            @click.stop="emit('track-add', track.id, $event)"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
          <button
            class="action-btn play-btn"
            title="立即播放"
            @click.stop="emit('track-play', track.id)"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 信息 -->
      <div class="card-info">
        <h3 class="card-title">{{ track.title }}</h3>
        <p class="card-artist">{{ track.artist }}</p>
        <div v-if="getGroupName(track)" class="card-group">
          <span class="group-dot" :style="{ backgroundColor: getGroupColor(track) }"></span>
          <span class="group-name" :style="{ color: getGroupColor(track) }">
            {{ getGroupName(track) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.explore-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 20px;
  width: 100%;
  overflow: hidden;
}

@media (min-width: 480px) {
  .explore-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .explore-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .explore-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.track-card {
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  min-width: 0;
  overflow: hidden;
}

.track-card:hover {
  transform: translateY(-4px);
}

.card-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 10px;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1);
}

.track-card:hover .cover-img {
  transform: scale(1.08);
}

.group-stripe {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  opacity: 0.8;
}

.views-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: white;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  border-radius: 8px;
}

.version-tags {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  gap: 4px;
}

.version-tag {
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  border-radius: 6px;
}

.card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  transition: opacity 0.25s ease;
}

.track-card:hover .card-overlay {
  opacity: 1;
}

.action-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
}

.add-btn {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
}

.add-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.play-btn {
  background: rgba(57, 197, 187, 0.85);
}

.play-btn:hover {
  background: rgba(57, 197, 187, 1);
  transform: scale(1.1);
}

.card-info {
  padding: 0 4px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-artist {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.group-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.group-name {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.2);
}
</style>
