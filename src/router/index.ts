import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Player from '@/views/Player.vue'
import Explore from '@/views/Explore.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/explore',
      name: 'explore',
      component: Explore,
    },
    {
      path: '/player/:id',
      name: 'player',
      component: Player,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

export default router
