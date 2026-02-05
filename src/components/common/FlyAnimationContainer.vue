<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
import { onMounted, ref } from 'vue'

const uiStore = useUIStore()
const playlistIconPos = ref({ x: 0, y: 0 })

const updatePlaylistIconPos = () => {
  // 查找播放列表图标的位置
  // 我们给 PlayerBar.vue 中的播放列表按钮加一个 ID: playlist-toggle-btn
  const btn = document.getElementById('playlist-toggle-btn')
  if (btn) {
    const rect = btn.getBoundingClientRect()
    playlistIconPos.value = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  } else {
    // 降级方案：右下角
    playlistIconPos.value = {
      x: window.innerWidth - 40,
      y: window.innerHeight - 40,
    }
  }
}

onMounted(() => {
  updatePlaylistIconPos()
  window.addEventListener('resize', updatePlaylistIconPos)
})
</script>

<template>
  <div class="fly-container fixed inset-0 pointer-events-none z-[100]">
    <TransitionGroup name="fly">
      <div
        v-for="item in uiStore.flyingItems"
        :key="item.id"
        class="fly-item fixed w-10 h-10 rounded-full overflow-hidden border-2 border-primary shadow-lg shadow-primary/40"
        :style="{
          '--start-x': `${item.x}px`,
          '--start-y': `${item.y}px`,
          '--end-x': `${playlistIconPos.x}px`,
          '--end-y': `${playlistIconPos.y}px`,
          left: 0,
          top: 0,
        }"
      >
        <img :src="item.image" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.fly-item {
  animation: fly-to-playlist 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
}

@keyframes fly-to-playlist {
  0% {
    transform: translate(calc(var(--start-x) - 50%), calc(var(--start-y) - 50%)) scale(1.5);
    opacity: 1;
  }

  20% {
    transform: translate(calc(var(--start-x) - 50%), calc(var(--start-y) - 50%)) scale(1.8);
    opacity: 1;
  }

  100% {
    transform: translate(calc(var(--end-x) - 50%), calc(var(--end-y) - 50%)) scale(0.2);
    opacity: 0.5;
  }
}

.fly-leave-active {
  transition: opacity 0.2s;
}

.fly-leave-to {
  opacity: 0;
}
</style>
