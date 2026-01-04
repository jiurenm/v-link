import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Player from '@/views/Player.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/player/:id',
      name: 'player',
      component: Player,
    },
  ],
})

export default router
