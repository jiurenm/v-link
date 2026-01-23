<script setup lang="ts">
interface Props {
  title?: string
  showBack?: boolean
  showSearch?: boolean
  showUser?: boolean
  showMenu?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'V-Link Music',
  showBack: false,
  showSearch: true,
  showUser: true,
  showMenu: false,
})

const emit = defineEmits<{
  back: []
  search: []
  user: []
  menu: []
}>()
</script>

<template>
  <nav class="sticky top-0 z-50 backdrop-blur-lg bg-[#06090e]/80 px-6 py-4 border-b border-white/5">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <button
        v-if="showBack"
        @click="emit('back')"
        class="text-white/80 hover:text-white transition-colors flex items-center gap-2"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span>返回</span>
      </button>
      <div v-else class="text-xl font-black italic tracking-tighter text-primary logo-breathing">
        V-LINK <span class="text-white/20 font-light">CORE</span>
      </div>
      <h1 v-if="showBack" class="text-xl font-bold text-white">{{ title }}</h1>
      <div class="flex items-center gap-6">
        <div v-if="!showBack" class="hidden md:flex gap-8 text-sm font-medium text-white/50">
          <a href="#" class="hover:text-primary transition-colors">探索</a>
          <a href="#" class="hover:text-primary transition-colors">合集</a>
          <a href="#" class="hover:text-primary transition-colors">排行榜</a>
        </div>
        <button
          v-if="showSearch"
          @click="emit('search')"
          class="relative text-white/80 hover:text-white transition-colors icon-glow"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
        <button
          v-if="showUser"
          @click="emit('user')"
          class="relative text-white/80 hover:text-white transition-colors icon-glow"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>
        <button
          v-if="showMenu"
          @click="emit('menu')"
          class="relative text-white/80 hover:text-white transition-colors icon-glow"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.logo-breathing {
  animation: breathing 3s ease-in-out infinite;
}

@keyframes breathing {
  0%,
  100% {
    opacity: 1;
    filter: brightness(1);
  }

  50% {
    opacity: 0.8;
    filter: brightness(1.2);
  }
}

.icon-glow {
  position: relative;
}

.icon-glow::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(57, 197, 187, 0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.icon-glow:hover::before {
  opacity: 1;
}
</style>
