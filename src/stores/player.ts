import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface Version {
  type: string
  label: string
  bvid?: string
  duration: number
  vocalists?: string[]
  vocal_type?: string
  views?: number
  vocalist?: string // 向后兼容字段
  videoUrl?: string
}

export type VersionType = string // 使用 label 作为版本标识，如 "2D MV 虚拟歌姬ver"、"3D MV"、"无MV" 等

export interface PJSKMeta {
  main_group?: string
  vocalist_type?: string
  difficulty?: {
    easy?: string
    normal?: string
    hard?: string
    expert?: string
    master?: string
    append?: string
  }
  // 向后兼容字段
  group?: string
  event_name?: string
  difficulty_master?: number
}

export interface Producer {
  id: string
  name: string
  avatar?: string
  topSongs?: Array<{ id: string; title: string; cover: string }>
  links?: Array<{ title: string; url: string; category?: string }>
  topWorks?: Array<{ id: string; url: string; title?: string }>
  pixivId?: string
}

export interface Track {
  id: string
  title: string
  artist: string
  cover: string // 从 cover_url 映射而来
  cover_url?: string // JSON 原始字段
  duration: number
  is_pjsk?: boolean // 是否为 PJSK 歌曲
  versions?: Version[] // 只有 is_pjsk 为 true 时才有多个版本
  currentVersion?: VersionType
  pjsk_meta?: PJSKMeta | null // JSON 中可能为 null
  voca_db_id?: number
  wiki_id?: string // 从 JSON 数据中映射
  total_views?: number // 从 JSON 数据中映射
  producer?: Producer
  illustrator?: Producer
  playCount?: number
  lyrics?: Array<{ time: number; text: string; translation?: string }>
  updated_at?: number
}

export const usePlayerStore = defineStore('player', () => {
  // 播放列表
  const queue = ref<Track[]>([])

  // 当前播放索引
  const currentIndex = ref(0)

  // 播放状态
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.7)

  // 播放模式
  const shuffle = ref(false)
  const repeat = ref<'off' | 'one' | 'all'>('off')

  // 当前版本（2D/3D/无MV）
  const currentVersion = ref<VersionType>('2D')

  // 播放器页面是否处于激活状态（用于控制视频 Teleport）
  const isPlayerActive = ref(false)

  // 计算当前播放的歌曲
  const currentTrack = computed((): Track | null => {
    if (queue.value.length === 0) {
      return null
    }
    const track = queue.value[currentIndex.value]
    return track ?? queue.value[0] ?? null
  })

  // 播放进度百分比
  const progress = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })

  // 设置播放列表
  function setQueue(tracks: Track[], startIndex: number = 0) {
    queue.value = tracks
    currentIndex.value = Math.max(0, Math.min(startIndex, tracks.length - 1))
    if (tracks.length > 0) {
      duration.value = tracks[currentIndex.value]?.duration ?? 0
    }
  }

  // 添加歌曲到播放列表
  function addToQueue(tracks: Track[]) {
    queue.value.push(...tracks)
  }

  // 播放/暂停
  function togglePlay() {
    isPlaying.value = !isPlaying.value
  }

  // 播放指定索引的歌曲
  function playTrack(index: number) {
    if (index >= 0 && index < queue.value.length) {
      const track = queue.value[index]
      if (track) {
        // 如果播放的是同一首歌曲，保持当前播放进度
        const isSameTrack = currentIndex.value === index
        currentIndex.value = index
        // 只有切换到不同歌曲时才重置播放时间
        if (!isSameTrack) {
          currentTime.value = 0
        }
        duration.value = track.duration
        // 强制设置为播放状态
        isPlaying.value = true
      }
    }
  }

  // 上一首
  function previousTrack() {
    if (queue.value.length === 0) return

    // 单曲循环模式下，重置当前歌曲的播放时间
    if (repeat.value === 'one') {
      currentTime.value = 0
      return
    }

    if (currentIndex.value > 0) {
      currentIndex.value--
    } else {
      // 列表循环模式下，从第一首跳到最后一首
      if (repeat.value === 'all') {
        currentIndex.value = queue.value.length - 1
      } else {
        // 非循环模式下，已经在第一首，不执行任何操作
        return
      }
    }
    currentTime.value = 0
    duration.value = queue.value[currentIndex.value]?.duration ?? 0
  }

  // 下一首
  function nextTrack() {
    if (queue.value.length === 0) return

    if (repeat.value === 'one') {
      currentTime.value = 0
      return
    }

    if (currentIndex.value < queue.value.length - 1) {
      currentIndex.value++
    } else {
      if (repeat.value === 'all') {
        currentIndex.value = 0
      } else {
        isPlaying.value = false
        return
      }
    }
    currentTime.value = 0
    duration.value = queue.value[currentIndex.value]?.duration ?? 0
  }

  // 切换随机播放
  function toggleShuffle() {
    shuffle.value = !shuffle.value
  }

  // 切换循环模式
  function toggleRepeat() {
    if (repeat.value === 'off') {
      repeat.value = 'all'
    } else if (repeat.value === 'all') {
      repeat.value = 'one'
    } else {
      repeat.value = 'off'
    }
  }

  // 设置播放时间
  function setCurrentTime(time: number) {
    currentTime.value = Math.max(0, Math.min(time, duration.value))
  }

  // 设置音量
  function setVolume(vol: number) {
    volume.value = Math.max(0, Math.min(1, vol))
  }

  // 设置时长
  function setDuration(dur: number) {
    duration.value = dur
  }

  // 切换版本
  function switchVersion(version: VersionType) {
    currentVersion.value = version
    const track = currentTrack.value
    if (version === '无MV') {
      // 无MV模式，使用歌曲总时长
      if (track) {
        duration.value = track.duration
        currentTime.value = 0
      }
    } else if (track?.versions) {
      // 使用 label 查找版本
      const versionData = track.versions.find((v) => v.label === version)
      if (versionData) {
        duration.value = versionData.duration
        // 切换版本时重置时间到0，因为不同版本的时间长度不同
        currentTime.value = 0
      }
    }
  }

  // 设置播放器激活状态
  function setPlayerActive(active: boolean) {
    isPlayerActive.value = active
  }

  return {
    // 状态
    queue,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    currentVersion,
    // 计算属性
    currentTrack,
    progress,
    // 方法
    setQueue,
    addToQueue,
    togglePlay,
    playTrack,
    previousTrack,
    nextTrack,
    toggleShuffle,
    toggleRepeat,
    setCurrentTime,
    setVolume,
    setDuration,
    switchVersion,
    isPlayerActive,
    setPlayerActive,
  }
})
