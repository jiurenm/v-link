<script setup lang="ts">
import FeaturedCard from './FeaturedCard.vue'

interface FeaturedItem {
  id: string
  title: string
  artist: string
  cover: string
}

interface Props {
  items: FeaturedItem[]
}

defineProps<Props>()

const emit = defineEmits<{
  'item-click': [id: string]
}>()

const gradients: string[] = [
  'from-primary to-accent-blue',
  'from-accent-pink to-accent-purple',
  'from-accent-blue to-primary',
  'from-accent-green to-primary',
  'from-accent-orange to-accent-pink',
]

const getGradient = (index: number): string => {
  return gradients[index % gradients.length] || gradients[0]!
}
</script>

<template>
  <section class="mb-12">
    <h2 class="text-3xl font-bold text-white mb-6 flex items-center gap-2">
      <span class="text-primary">🎵</span>
      精选推荐
    </h2>
    <div class="overflow-x-auto scrollbar-hide">
      <div class="flex gap-6 pb-4">
        <FeaturedCard
          v-for="(item, index) in items"
          :key="item.id"
          :id="item.id"
          :title="item.title"
          :artist="item.artist"
          :cover="item.cover"
          :gradient="getGradient(index)"
          @click="emit('item-click', $event)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
