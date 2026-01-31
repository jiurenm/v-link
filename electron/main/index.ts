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

/**
 * 代理配置
 */
const proxyConfig = {
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
}

/**
 * 设置生产环境的请求代理
 * 使用 Electron 的 protocol 模块拦截和代理请求
 */
function setupProductionProxy(): void {
  // 拦截所有 http/https 请求
  session.defaultSession.webRequest.onBeforeRequest(
    {
      urls: ['*://localhost/*', 'file://*/*'],
    },
    (details, callback) => {
      const url = details.url

      // 处理 /bili-video 动态代理
      // 格式: /bili-video/HOST/path -> https://HOST/path
      const biliVideoMatch = url.match(/\/bili-video\/([^/]+)(.*)$/)
      if (biliVideoMatch) {
        const host = biliVideoMatch[1]
        const path = biliVideoMatch[2]
        callback({
          redirectURL: `https://${host}${path}`,
        })
        return
      }

      // 处理静态代理路径
      for (const [prefix, config] of Object.entries(proxyConfig)) {
        if (url.includes(prefix)) {
          const pathMatch = url.match(new RegExp(`${prefix}(.*)$`))
          if (pathMatch) {
            const targetUrl = config.target + pathMatch[1]
            callback({ redirectURL: targetUrl })
            return
          }
        }
      }

      callback({})
    },
  )

  // 修改请求头以添加必要的 Referer 和 Origin
  session.defaultSession.webRequest.onBeforeSendHeaders(
    {
      urls: ['*://*.bilibili.com/*', '*://*.bilivideo.com/*'],
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
      urls: ['*://*.bilibili.com/*', '*://*.bilivideo.com/*'],
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
      // 生产环境需要允许访问远程内容
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

  // 开发环境加载 Vite 开发服务器，生产环境加载打包后的文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.v-link')

  // 仅在生产环境设置代理
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
