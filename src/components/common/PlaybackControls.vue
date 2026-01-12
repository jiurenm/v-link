<script setup lang="ts">
interface Props {
  isPlaying: boolean
  shuffle?: boolean
  repeat?: 'off' | 'one' | 'all'
  showShuffle?: boolean
  showRepeat?: boolean
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  shuffle: false,
  repeat: 'off',
  showShuffle: true,
  showRepeat: true,
  size: 'medium',
})

const emit = defineEmits<{
  play: []
  pause: []
  previous: []
  next: []
  'toggle-shuffle': []
  'toggle-repeat': []
}>()

const togglePlay = () => {
  if (props.isPlaying) {
    emit('pause')
  } else {
    emit('play')
  }
}

const iconSizeClass = {
  small: 'w-5 h-5',
  medium: 'w-6 h-6',
  large: 'w-10 h-10',
}

const playButtonSizeClass = {
  small: 'w-8 h-8',
  medium: 'w-10 h-10',
  large: 'w-16 h-16',
}
</script>

<template>
  <div class="flex items-center justify-center gap-6">
    <button
      v-if="showShuffle"
      @click="emit('toggle-shuffle')"
      class="text-white/60 hover:text-white transition-colors"
      :class="{ 'text-white': shuffle }"
    >
      <svg :class="iconSizeClass[size]" fill="currentColor" viewBox="0 0 24 24">
        <path
          d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
        />
      </svg>
    </button>
    <button @click="emit('previous')" class="text-white hover:text-white/80 transition-colors">
      <svg :class="iconSizeClass[size]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
      </svg>
    </button>
    <button
      @click="togglePlay"
      :class="[
        'rounded-full bg-primary text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg hover:bg-primary-600',
        playButtonSizeClass[size],
      ]"
      style="
        box-shadow:
          0 0 20px rgba(57, 197, 187, 0.5),
          0 0 40px rgba(57, 197, 187, 0.3);
      "
    >
      <svg
        v-if="!isPlaying"
        :class="size === 'small' ? 'w-4 h-4' : size === 'medium' ? 'w-5 h-5' : 'w-8 h-8'"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
      <svg
        v-else
        :class="size === 'small' ? 'w-4 h-4' : size === 'medium' ? 'w-5 h-5' : 'w-8 h-8'"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
      </svg>
    </button>
    <button @click="emit('next')" class="text-white hover:text-white/80 transition-colors">
      <svg :class="iconSizeClass[size]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
      </svg>
    </button>
    <button
      v-if="showRepeat"
      @click="emit('toggle-repeat')"
      class="text-white/60 hover:text-white transition-colors relative"
      :class="{ 'text-white': repeat !== 'off', 'text-primary': repeat !== 'off' }"
      :title="repeat === 'off' ? '顺序播放' : repeat === 'all' ? '列表循环' : '单曲循环'"
    >
      <svg :class="iconSizeClass[size]" fill="currentColor" viewBox="0 0 24 24">
        <!-- 顺序播放：列表加箭头图标 -->
        <g v-if="repeat === 'off'">
          <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h12v2H3v-2z" />
          <path d="M18 14l4 4-4 4v-3h-4v-2h4v-3z" />
        </g>
        <!-- 列表循环：循环图标 + 小圆点 -->
        <g v-else-if="repeat === 'all'">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v6z" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </g>
        <!-- 单曲循环：循环图标 + 圆圈内数字 1 -->
        <g v-else>
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v6z" />
          <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.9" />
          <text x="12" y="15.5" text-anchor="middle" font-size="7" font-weight="bold" fill="white">
            1
          </text>
        </g>
      </svg>
    </button>
  </div>
</template>
