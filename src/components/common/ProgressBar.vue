<script setup lang="ts">
interface Props {
  progress: number // 0-100
  currentTime: number
  duration: number
  showTime?: boolean
  size?: 'small' | 'medium' | 'large'
}

withDefaults(defineProps<Props>(), {
  showTime: true,
  size: 'medium',
})

const emit = defineEmits<{
  seek: [event: MouseEvent]
}>()

const heightClass = {
  small: 'h-0.5',
  medium: 'h-1',
  large: 'h-1.5',
}

const thumbSizeClass = {
  small: 'w-2 h-2 -top-0.5',
  medium: 'w-2.5 h-2.5 -top-1',
  large: 'w-4 h-4 -top-1.5',
}
</script>

<template>
  <div>
    <div v-if="showTime" class="flex items-center justify-between text-sm text-white/60 mb-2">
      <span>{{ formatTime(currentTime) }}</span>
      <span>{{ formatTime(duration) }}</span>
    </div>
    <div
      :class="[
        'relative rounded-full cursor-pointer group',
        heightClass[size],
        size === 'small' ? 'bg-white/20' : 'bg-white/20',
      ]"
      @click="emit('seek', $event)"
    >
      <div
        class="absolute h-full bg-primary rounded-full transition-all"
        :style="{ width: `${progress}%` }"
      ></div>
      <div
        :class="[
          'absolute bg-primary rounded-full transition-all opacity-0 group-hover:opacity-100',
          thumbSizeClass[size],
          size === 'small'
            ? 'group-hover:w-2.5 group-hover:h-2.5 group-hover:-top-1'
            : size === 'medium'
              ? 'group-hover:w-3 group-hover:h-3 group-hover:-top-1.5'
              : '',
        ]"
        :style="{
          left: `calc(${progress}% - ${size === 'small' ? '4px' : size === 'medium' ? '5px' : '8px'})`,
        }"
      ></div>
    </div>
  </div>
</template>

<script lang="ts">
import { formatTime } from '@/utils/format'

export default {
  methods: {
    formatTime,
  },
}
</script>
