import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    build: {
      externalizeDeps: true,
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/main/index.ts'),
        },
        external: ['electron', '@electron-toolkit/utils'],
      },
    },
  },
  preload: {
    build: {
      externalizeDeps: true,
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/preload/index.ts'),
        },
        external: ['electron', '@electron-toolkit/utils'],
      },
    },
  },
  renderer: {
    root: '.',
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve('src'),
      },
    },
    plugins: [vue(), tailwindcss()],
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
        '/vocadb-api': {
          target: 'https://vocadb.net',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/vocadb-api/, ''),
          headers: {
            'User-Agent': 'V-Link/1.0',
          },
        },
        '/pixiv-api': {
          target: 'https://www.pixiv.net',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/pixiv-api/, ''),
          headers: {
            Referer: 'https://www.pixiv.net',
          },
        },
        // 动态代理B站视频流
        // 格式: /bili-video/HOST/path -> https://HOST/path
        '/bili-video': {
          target: 'https://upos-sz-mirrorcos.bilivideo.com', // 默认目标
          changeOrigin: true,
          secure: false,
          headers: {
            Referer: 'https://www.bilibili.com',
            Origin: 'https://www.bilibili.com',
          },
          // 使用 router 动态确定目标域名
          // @ts-expect-error - Vite proxy types don't include router but http-proxy supports it
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
  },
})
