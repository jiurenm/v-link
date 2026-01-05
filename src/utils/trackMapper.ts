/**
 * 将 JSON 数据转换为 Track 格式
 */
import type { Track, Version } from '@/stores/player'

export interface SongFromJSON {
  id: string
  title: string
  artist: string
  is_pjsk: boolean
  pjsk_meta?: {
    group?: string
    event_name?: string
    difficulty_master?: number
  } | null
  voca_db_id?: number
  cover_url: string
  versions?: Array<{
    type: '2D' | '3D'
    label: string
    bvid?: string
    duration: number
    vocalist?: string
    videoUrl?: string
  }>
}

/**
 * 将 JSON 歌曲数据转换为 Track 格式
 */
export function mapSongToTrack(song: SongFromJSON): Track {
  const track: Track = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    cover: song.cover_url, // 映射 cover_url 到 cover
    cover_url: song.cover_url, // 保留原始字段
    duration: song.versions?.[0]?.duration || 0, // 默认使用第一个版本的时长
    is_pjsk: song.is_pjsk,
    voca_db_id: song.voca_db_id,
    pjsk_meta: song.pjsk_meta || undefined,
  }

  // 如果有版本信息，映射版本数据
  if (song.versions && song.versions.length > 0) {
    track.versions = song.versions.map(
      (v): Version => ({
        type: v.type,
        label: v.label,
        bvid: v.bvid,
        duration: v.duration,
        vocalist: v.vocalist,
        videoUrl: v.videoUrl,
      }),
    )

    // 设置默认版本为第一个版本
    track.currentVersion = track.versions[0]?.type || '2D'

    // 如果只有一个版本，duration 使用该版本的时长
    if (track.versions.length === 1 && track.versions[0]) {
      track.duration = track.versions[0].duration
    } else if (track.versions.length > 1) {
      // 多个版本时，使用最长的时长作为总时长
      track.duration = Math.max(...track.versions.map((v) => v.duration))
    }
  }

  return track
}

/**
 * 批量转换歌曲数据
 */
export function mapSongsToTracks(songs: SongFromJSON[]): Track[] {
  return songs.map(mapSongToTrack)
}
