/**
 * 音频管理器 - 实现音频连续性
 * 在切换 2D/3D 视频时保持音频不中断
 */

export class AudioManager {
  private audioContext: AudioContext | null = null
  private audioBuffer: AudioBuffer | null = null
  private sourceNode: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private currentTime = 0
  private isPlaying = false
  private startTime = 0
  private pausedTime = 0

  /**
   * 初始化音频上下文
   */
  async init(): Promise<void> {
    if (!this.audioContext) {
      const AudioContextClass =
        window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass()
        this.gainNode = this.audioContext.createGain()
        this.gainNode.connect(this.audioContext.destination)
      }
    }
  }

  /**
   * 加载音频文件
   */
  async loadAudio(audioUrl: string): Promise<void> {
    if (!this.audioContext) {
      await this.init()
    }

    if (!this.audioContext) {
      throw new Error('音频上下文初始化失败')
    }

    try {
      const response = await fetch(audioUrl)
      const arrayBuffer = await response.arrayBuffer()
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
    } catch (error) {
      console.error('音频加载失败:', error)
      throw error
    }
  }

  /**
   * 播放音频
   */
  play(offset: number = 0): void {
    if (!this.audioContext || !this.audioBuffer) {
      return
    }

    this.stop()

    this.sourceNode = this.audioContext.createBufferSource()
    this.sourceNode.buffer = this.audioBuffer
    this.sourceNode.connect(this.gainNode!)

    const startOffset = Math.max(0, offset)
    this.startTime = this.audioContext.currentTime - startOffset
    this.sourceNode.start(0, startOffset)

    this.isPlaying = true
    this.currentTime = startOffset
  }

  /**
   * 暂停音频
   */
  pause(): void {
    if (!this.audioContext || !this.sourceNode) {
      return
    }

    this.pausedTime = this.getCurrentTime()
    this.stop()
    this.isPlaying = false
  }

  /**
   * 恢复播放
   */
  resume(): void {
    if (!this.audioContext || !this.audioBuffer) {
      return
    }

    this.play(this.pausedTime)
  }

  /**
   * 停止音频
   */
  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop()
      } catch (e) {
        // 忽略已停止的节点错误
        console.error('停止音频失败:', e)
      }
      this.sourceNode = null
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * 获取当前播放时间
   */
  getCurrentTime(): number {
    if (!this.audioContext || !this.isPlaying) {
      return this.pausedTime
    }

    return this.audioContext.currentTime - this.startTime
  }

  /**
   * 跳转到指定时间
   */
  seekTo(time: number): void {
    const wasPlaying = this.isPlaying
    this.pause()
    this.pausedTime = time
    if (wasPlaying) {
      this.resume()
    }
  }

  /**
   * 切换音频源（无缝切换）
   */
  async switchAudio(newAudioUrl: string, preserveTime: boolean = true): Promise<void> {
    const currentTime = this.getCurrentTime()
    const wasPlaying = this.isPlaying

    // 加载新音频
    await this.loadAudio(newAudioUrl)

    // 如果正在播放，从相同位置继续
    if (wasPlaying && preserveTime) {
      this.play(currentTime)
    } else if (wasPlaying) {
      this.play(0)
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.audioBuffer = null
    this.gainNode = null
  }
}

// 单例实例
let audioManagerInstance: AudioManager | null = null

export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager()
  }
  return audioManagerInstance
}
