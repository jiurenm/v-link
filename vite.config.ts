import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/pjsekai': {
        target: 'https://pjsekai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pjsekai/, ''),
      },
      '/bili-api': {
        target: 'https://api.bilibili.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bili-api/, ''),
        headers: {
          Referer: 'https://www.bilibili.com',
        },
      },
      // 动态代理B站视频流
      // 格式: /bili-video/HOST/path -> https://HOST/path
      // 注意：由于Vite代理不支持动态router，我们在bilibili.ts中转换URL格式
      '/bili-video': {
        target: 'https://upos-sz-mirrorcos.bilivideo.com', // 默认目标
        changeOrigin: true,
        secure: false,
        headers: {
          Referer: 'https://www.bilibili.com/',
          Origin: 'https://www.bilibili.com',
        },
        // 使用 router 动态确定目标域名
        // @ts-expect-error - Vite proxy types don't include router but http-proxy logic supports it
        router: (req: { url: string }) => {
          if (!req.url) return undefined
          const match = req.url.match(/^\/bili-video\/([^/]+)/)
          if (match && match[1]) {
            return `https://${match[1]}`
          }
          return undefined
        },
        rewrite: (path: string) => {
          // 从路径中移除 /bili-video/HOST 部分，保留实际路径
          const match = path.match(/^\/bili-video\/[^/]+(.*)$/)
          return match ? match[1] : path
        },
      },
    },
  },
})
