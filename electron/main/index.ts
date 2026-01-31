import { app, BrowserWindow, shell, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// @ts-expect-error - icon is a png asset handled by electron-vite
import iconPng from '../../public/favicon.png?asset'
// @ts-expect-error - icon is an ico asset handled by electron-vite
import iconIco from '../../public/favicon.ico?asset'
// @ts-expect-error - icon is an icns asset handled by electron-vite
import iconIcns from '../../public/favicon.icns?asset'

const appIcon =
  process.platform === 'win32' ? iconIco : process.platform === 'darwin' ? iconIcns : iconPng

interface ProxyItem {
  target: string
  headers?: Record<string, string>
  changeOrigin?: boolean
}

/**
 * 代理配置
 */
const proxyConfig: Record<string, ProxyItem> = {
  '/pjsekai': {
    target: 'https://pjsekai.com',
    headers: {},
  },
  '/bili-api': {
    target: 'https://api.bilibili.com',
    headers: {
      Referer: 'https://www.bilibili.com',
    },
  },
  '/vocadb-api': {
    target: 'https://vocadb.net',
    changeOrigin: true,
  },
  '/pixiv-api': {
    target: 'https://www.pixiv.net',
    headers: {
      Referer: 'https://www.pixiv.net',
    },
  },
}

/**
 * 设置通用的请求头修改（B站相关）
 * 解决图片 403 和视频流 CORS 问题
 */
function setupWebRequestHandlers(): void {
  const biliDomains = ['*://*.bilibili.com/*', '*://*.bilivideo.com/*', '*://*.hdslb.com/*']

  // 修改请求头以添加必要的 Referer 和 Origin
  session.defaultSession.webRequest.onBeforeSendHeaders(
    {
      urls: biliDomains,
    },
    (details, callback) => {
      const headers = { ...details.requestHeaders }
      headers['Referer'] = 'https://www.bilibili.com'
      headers['Origin'] = 'https://www.bilibili.com'
      callback({ requestHeaders: headers })
    },
  )

  // 处理 CORS 响应头
  session.defaultSession.webRequest.onHeadersReceived(
    {
      urls: biliDomains,
    },
    (details, callback) => {
      const headers = { ...details.responseHeaders }
      // 移除可能阻止请求的 CORS 头
      delete headers['x-frame-options']
      delete headers['X-Frame-Options']
      // 添加 CORS 头
      headers['Access-Control-Allow-Origin'] = ['*']
      headers['Access-Control-Allow-Methods'] = ['GET, POST, PUT, DELETE, OPTIONS']
      headers['Access-Control-Allow-Headers'] = ['*']
      callback({ responseHeaders: headers })
    },
  )
}

/**
 * 设置生产环境的请求代理
 */
function setupProductionProxy(): void {
  // 拦截所有 http/https 请求进行路径映射
  session.defaultSession.webRequest.onBeforeRequest(
    {
      urls: ['*://localhost/*', 'file://*/*'],
    },
    (details, callback) => {
      const url = details.url

      // 处理 /bili-video 动态代理
      const biliVideoMatch = url.match(/\/bili-video\/([^/]+)(.*)$/)
      if (biliVideoMatch) {
        callback({
          redirectURL: `https://${biliVideoMatch[1]}${biliVideoMatch[2]}`,
        })
        return
      }

      // 处理静态代理路径
      for (const [prefix, config] of Object.entries(proxyConfig)) {
        if (url.includes(prefix)) {
          const pathMatch = url.match(new RegExp(`${prefix}(.*)$`))
          if (pathMatch) {
            callback({ redirectURL: config.target + pathMatch[1] })
            return
          }
        }
      }

      callback({})
    },
  )
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    icon: appIcon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // 开发环境需要允许访问远程内容，生产环境通过 WebRequest 代理
      webSecurity: is.dev,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.v-link')

  // 1. 设置通用的 WebRequest 处理（开发和生产环境都需要）
  setupWebRequestHandlers()

  // 2. 仅在生产环境设置路由代理
  if (!is.dev) {
    setupProductionProxy()
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
