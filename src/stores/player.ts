import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import coverImage from '@/assets/images/cover.jpg'

export interface Track {
  id: string
  title: string
  artist: string
  cover: string
  duration: number
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
        currentIndex.value = index
        currentTime.value = 0
        duration.value = track.duration
        if (!isPlaying.value) {
          isPlaying.value = true
        }
      }
    }
  }

  // 上一首
  function previousTrack() {
    if (queue.value.length === 0) return

    if (currentIndex.value > 0) {
      currentIndex.value--
    } else {
      currentIndex.value = queue.value.length - 1
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
  }
})
