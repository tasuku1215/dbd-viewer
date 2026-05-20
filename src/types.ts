export type Role = 'killer' | 'survivor1' | 'survivor2' | 'survivor3' | 'survivor4'

export interface PanelConfig {
  role: Role
  label: string
  emoji: string
  name: string
  url: string
  offset: number // seconds: when master is at T, this panel plays at T + offset
}

export type Layout = 'default' | 'focus' | 'equal'

export interface Memo {
  id: string
  time: number
}

export interface ShareData {
  v: Array<{ role: Role; name: string; url: string; offset: number }>
  t: number   // playback time in seconds at share moment
  speed: number
}

// Minimal YT IFrame API types
declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
  namespace YT {
    class Player {
      constructor(elementId: string, options: PlayerOptions)
      playVideo(): void
      pauseVideo(): void
      seekTo(seconds: number, allowSeekAhead: boolean): void
      getCurrentTime(): number
      getDuration(): number
      setVolume(volume: number): void
      mute(): void
      unMute(): void
      isMuted(): boolean
      setPlaybackRate(rate: number): void
      setPlaybackQuality(quality: string): void
      getAvailableQualityLevels(): string[]
      getPlayerState(): number
      destroy(): void
    }
    interface PlayerOptions {
      videoId?: string
      playerVars?: PlayerVars
      events?: PlayerEvents
    }
    interface PlayerVars {
      autoplay?: 0 | 1
      controls?: 0 | 1
      rel?: 0 | 1
      modestbranding?: 0 | 1
      playsinline?: 0 | 1
      fs?: 0 | 1
      mute?: 0 | 1
    }
    interface PlayerEvents {
      onReady?: (event: { target: Player }) => void
      onStateChange?: (event: { data: number }) => void
      onError?: (event: { data: number }) => void
    }
    const PlayerState: {
      UNSTARTED: -1
      ENDED: 0
      PLAYING: 1
      PAUSED: 2
      BUFFERING: 3
      CUED: 5
    }
  }
}
