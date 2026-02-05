import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface FlyItem {
  id: string
  x: number
  y: number
  image: string
}

export const useUIStore = defineStore('ui', () => {
  const flyingItems = ref<FlyItem[]>([])

  function addFlyItem(item: Omit<FlyItem, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9)
    const newItem = { ...item, id }
    flyingItems.value.push(newItem)

    // 自动移除（动画结束后）
    setTimeout(() => {
      removeFlyItem(id)
    }, 1000)
  }

  function removeFlyItem(id: string) {
    flyingItems.value = flyingItems.value.filter((item) => item.id !== id)
  }

  return {
    flyingItems,
    addFlyItem,
    removeFlyItem,
  }
})
