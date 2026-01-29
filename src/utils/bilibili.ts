/**
 * Bilibili API 工具函数
 * 用于获取视频信息和DASH流URL
 */

const TARGET_DOMAINS = ['upos-sz-mirrorcos.bilivideo.com', 'upos-sz-estgoss.bilivideo.com']

export interface VideoInfo {
  bvid: string
  aid: number
  cid: number
  title: string
  pic: string
  duration: number
}

export interface DashStream {
  id: number // 清晰度代码
  baseUrl: string
  backupUrl?: string[]
  bandwidth: number
  mimeType: string
  codecs: string
  width?: number
  height?: number
  frameRate?: string
}

export interface DashPlayInfo {
  duration: number
  video: DashStream[]
  audio: DashStream[]
}

/**
 * 根据bvid获取视频基本信息（包含cid）
 * 使用 /x/web-interface/view 接口
 */
export async function getVideoInfo(bvid: string): Promise<VideoInfo | null> {
  try {
    const response = await fetch(`/bili-api/x/web-interface/view?bvid=${bvid}`)
    const data = await response.json()

    if (data.code !== 0) {
      console.error('获取视频信息失败:', data.message)
      return null
    }

    return {
      bvid: data.data.bvid,
      aid: data.data.aid,
      cid: data.data.cid, // 默认第一P的cid
      title: data.data.title,
      pic: data.data.pic,
      duration: data.data.duration,
    }
  } catch (error) {
    console.error('获取视频信息出错:', error)
    return null
  }
}

/**
 * 根据bvid和cid获取DASH格式的视频流URL
 * fnval=16 表示请求DASH格式
 */
export async function getDashPlayUrl(bvid: string, cid: number): Promise<DashPlayInfo | null> {
  try {
    const params = new URLSearchParams({
      bvid,
      cid: cid.toString(),
      fnval: '16', // DASH格式
      fnver: '0',
      fourk: '1', // 允许4K
    })

    const response = await fetch(`/bili-api/x/player/wbi/playurl?${params}`)
    const data = await response.json()

    if (data.code !== 0) {
      console.error('获取播放地址失败:', data.message)
      return null
    }

    const dash = data.data.dash
    if (!dash) {
      console.error('该视频不支持DASH格式')
      return null
    }

    // 定义响应中的流接口
    interface ApiDashStream {
      id: number
      baseUrl?: string
      base_url?: string
      backupUrl?: string[]
      backup_url?: string[]
      bandwidth: number
      mimeType?: string
      mime_type?: string
      codecs: string
      width?: number
      height?: number
      frameRate?: string
      frame_rate?: string
    }

    return {
      duration: dash.duration,
      video: dash.video.map((v: ApiDashStream) => ({
        id: v.id,
        baseUrl: v.baseUrl || v.base_url || '',
        backupUrl: v.backupUrl || v.backup_url,
        bandwidth: v.bandwidth,
        mimeType: v.mimeType || v.mime_type || '',
        codecs: v.codecs,
        width: v.width,
        height: v.height,
        frameRate: v.frameRate || v.frame_rate,
      })),
      audio:
        dash.audio?.map((a: ApiDashStream) => ({
          id: a.id,
          baseUrl: a.baseUrl || a.base_url || '',
          backupUrl: a.backupUrl || a.backup_url,
          bandwidth: a.bandwidth,
          mimeType: a.mimeType || a.mime_type,
          codecs: a.codecs,
        })) || [],
    }
  } catch (error) {
    console.error('获取播放地址出错:', error)
    return null
  }
}

/**
 * 选择最佳的视频流（根据清晰度ID选择）
 * 清晰度优先级: 80(1080P) > 64(720P) > 32(480P) > 16(360P)
 * 编码优先级: AVC(codecid=7) 优先于 HEVC(codecid=12)，因为兼容性更好
 */
export function selectBestVideoStream(streams: DashStream[]): DashStream | null {
  if (!streams || streams.length === 0) return null

  // 按清晰度降序排序
  const sorted = [...streams].sort((a, b) => b.id - a.id)

  // 优先选择1080P以下的流（避免需要会员的高清晰度）
  // 同时优先选择AVC编码（codecs以avc1开头）
  const preferred = sorted.find((s) => s.id <= 80 && s.codecs.startsWith('avc1'))

  if (preferred) return preferred

  // 如果没有AVC编码的，选择任意1080P以下的
  const fallback = sorted.find((s) => s.id <= 80)
  if (fallback) return fallback

  // 实在没有就返回第一个
  return sorted[0] || null
}

/**
 * 选择最佳的音频流
 * 音频清晰度: 30280(192K) > 30232(132K) > 30216(64K)
 */
export function selectBestAudioStream(streams: DashStream[]): DashStream | null {
  if (!streams || streams.length === 0) return null

  // 按清晰度降序排序
  const sorted = [...streams].sort((a, b) => b.id - a.id)

  // 返回最高质量的音频
  return sorted[0] || null
}

/**
 * 将B站视频URL转换为代理URL格式
 * 从原始URL: https://HOST/path -> /bili-video/HOST/path
 */
function convertToProxyUrl(originalUrl: string): string {
  try {
    const url = new URL(originalUrl)
    // 使用 TARGET_DOMAINS[0] 或当前匹配的域名作为固定代理 target
    // 实际代理逻辑由 vite.config.ts 处理（可能需要 router 支持）
    // 因为Vite代理只能有一个固定target
    // vite.config.ts 中的 rewrite 规则是 /bili-video/HOST/path -> /path
    // 所以我们需要在路径中包含 host
    return `/bili-video/${url.hostname}${url.pathname}${url.search}`
  } catch {
    return originalUrl
  }
}

/**
 * 从流中选择最佳URL（优先使用 mirrorcos 域名的备用URL）
 */
function selectBestUrl(stream: DashStream): string {
  // 收集所有可用URL
  const allUrls = [stream.baseUrl, ...(stream.backupUrl || [])]

  // 优先查找 target domains 的 URL
  const targetUrl = allUrls.find((url) => TARGET_DOMAINS.some((domain) => url.includes(domain)))

  if (targetUrl) {
    return convertToProxyUrl(targetUrl)
  }

  // 回退到baseUrl
  return convertToProxyUrl(stream.baseUrl)
}

/**
 * 获取完整的播放信息（视频URL + 音频URL）
 * URL会被转换为代理格式以绕过CORS限制
 */
export async function getPlayUrls(bvid: string): Promise<{
  videoUrl: string
  audioUrl: string
  duration: number
} | null> {
  // 1. 获取视频信息（包含cid）
  const videoInfo = await getVideoInfo(bvid)
  if (!videoInfo) return null

  // 2. 获取DASH播放地址
  const dashInfo = await getDashPlayUrl(bvid, videoInfo.cid)
  if (!dashInfo) return null

  // 3. 选择最佳的视频和音频流
  // 过滤出包含目标域名的流
  const filteredVideo = dashInfo.video.filter(
    (s) =>
      TARGET_DOMAINS.some((domain) => s.baseUrl.includes(domain)) ||
      s.backupUrl?.some((url) => TARGET_DOMAINS.some((domain) => url.includes(domain))),
  )
  const filteredAudio = dashInfo.audio.filter(
    (s) =>
      TARGET_DOMAINS.some((domain) => s.baseUrl.includes(domain)) ||
      s.backupUrl?.some((url) => TARGET_DOMAINS.some((domain) => url.includes(domain))),
  )

  console.log('filteredVideo', filteredAudio)

  const videoStream = selectBestVideoStream(
    filteredVideo.length > 0 ? filteredVideo : dashInfo.video,
  )
  const audioStream = selectBestAudioStream(
    filteredAudio.length > 0 ? filteredAudio : dashInfo.audio,
  )

  if (!videoStream || !audioStream) {
    console.error('无法获取视频或音频流')
    return null
  }

  return {
    videoUrl: selectBestUrl(videoStream),
    audioUrl: selectBestUrl(audioStream),
    duration: dashInfo.duration,
  }
}

/**
 * 仅获取音频URL（用于无MV模式）
 */
export async function getAudioUrl(bvid: string): Promise<{
  audioUrl: string
  duration: number
} | null> {
  // 1. 获取视频信息（包含cid）
  const videoInfo = await getVideoInfo(bvid)
  if (!videoInfo) return null

  // 2. 获取DASH播放地址
  const dashInfo = await getDashPlayUrl(bvid, videoInfo.cid)
  if (!dashInfo) return null

  // 3. 选择最佳的音频流
  // 过滤出包含目标域名的流
  const filteredAudio = dashInfo.audio.filter(
    (s) =>
      TARGET_DOMAINS.some((domain) => s.baseUrl.includes(domain)) ||
      s.backupUrl?.some((url) => TARGET_DOMAINS.some((domain) => url.includes(domain))),
  )

  const audioStream = selectBestAudioStream(
    filteredAudio.length > 0 ? filteredAudio : dashInfo.audio,
  )

  if (!audioStream) {
    console.error('无法获取音频流')
    return null
  }

  return {
    audioUrl: selectBestUrl(audioStream),
    duration: dashInfo.duration,
  }
}
