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
  <nav class="sticky top-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
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
        <h1 v-else class="text-2xl font-bold text-primary">{{ title }}</h1>
        <h1 v-if="showBack" class="text-xl font-bold text-white">{{ title }}</h1>
        <div class="flex items-center gap-4">
          <button
            v-if="showSearch"
            @click="emit('search')"
            class="text-white/80 hover:text-white transition-colors"
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
            class="text-white/80 hover:text-white transition-colors"
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
            class="text-white/80 hover:text-white transition-colors"
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
    </div>
  </nav>
</template>
