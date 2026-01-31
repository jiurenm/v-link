/**
 * 环境检测工具
 * 用于检测是否在 Electron 环境中运行
 */

// 扩展 Window 接口以包含 Electron 相关属性
declare global {
  interface Window {
    electron?: unknown
  }
}

/**
 * 检测是否在 Electron 渲染进程中运行
 */
export function isElectron(): boolean {
  // 检查 window.electron 是否存在（由 preload 脚本注入）
  return typeof window !== 'undefined' && window.electron !== undefined
}

/**
 * 检测是否在 Electron 生产环境中运行
 * 生产环境使用 file:// 协议加载页面
 */
export function isElectronProduction(): boolean {
  return isElectron() && window.location.protocol === 'file:'
}

/**
 * 获取 API 基础 URL
 * 开发环境使用代理路径，生产环境使用完整 URL
 */
export function getApiBaseUrl(proxyPath: string): string {
  if (isElectronProduction()) {
    // 生产环境直接使用真实 URL
    const mapping: Record<string, string> = {
      '/bili-api': 'https://api.bilibili.com',
      '/pjsekai': 'https://pjsekai.com',
    }
    return mapping[proxyPath] || proxyPath
  }
  // 开发环境使用代理路径
  return proxyPath
}

/**
 * 转换视频代理 URL
 * 开发环境: /bili-video/HOST/path
 * 生产环境: https://HOST/path
 */
export function convertVideoProxyUrl(proxyUrl: string): string {
  if (isElectronProduction()) {
    // 生产环境：从代理格式转换为真实 URL
    const match = proxyUrl.match(/^\/bili-video\/([^/]+)(.*)$/)
    if (match) {
      return `https://${match[1]}${match[2]}`
    }
    return proxyUrl
  }
  // 开发环境保持代理格式
  return proxyUrl
}
