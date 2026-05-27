import { memo, useEffect, useRef } from 'react'
import { useYouTubeAPI } from '../hooks/useYouTubeAPI'
import { extractVideoId } from '../utils/youtube'
import { PanelConfig } from '../types'

interface Props {
  panel: PanelConfig
  index: number
  isFocused: boolean
  isExpanded: boolean
  onClick: () => void
  onPlayerReady: (index: number, player: YT.Player) => void
  onPlayerDestroy: (index: number) => void
  onOffsetChange: (index: number, delta: number) => void
  onToggleExpand: () => void
}

// C4: wrap with React.memo so the 5 panels don't re-render every 200ms sync tick
const VideoPanel = memo(function VideoPanel({
  panel, index, isFocused, isExpanded, onClick,
  onPlayerReady, onPlayerDestroy, onOffsetChange, onToggleExpand,
}: Props) {
  const apiReady = useYouTubeAPI()
  const playerRef = useRef<YT.Player | null>(null)
  const divId = `yt-player-${index}`
  const videoId = extractVideoId(panel.url)

  useEffect(() => {
    // Destroy any existing player first (handles videoId change or url cleared)
    if (playerRef.current) {
      try { playerRef.current.destroy() } catch {}
      playerRef.current = null
      onPlayerDestroy(index)
    }

    if (!apiReady || !videoId) return

    // H2: use `active` flag to guard against race where cleanup fires before onReady
    let active = true

    const player = new window.YT.Player(divId, {
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        fs: 0,
        mute: 1,
      },
      events: {
        onReady: (e) => {
          if (!active) {
            // Effect cleaned up before onReady fired — destroy the orphaned player
            try { e.target.destroy() } catch {}
            return
          }
          playerRef.current = e.target
          onPlayerReady(index, e.target)
        },
      },
    })

    return () => {
      active = false
      try { player.destroy() } catch {}
      playerRef.current = null
      onPlayerDestroy(index)
    }
  }, [apiReady, videoId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleOffset(delta: number, e: React.MouseEvent | React.TouchEvent) {
    e.stopPropagation()
    onOffsetChange(index, delta)
  }

  function handleExpand(e: React.MouseEvent) {
    e.stopPropagation()
    onToggleExpand()
  }

  return (
    <div
      className={`video-panel ${isFocused ? 'focused' : ''} ${!videoId ? 'empty' : ''} ${isExpanded ? 'expanded' : ''}`}
      onClick={onClick}
    >
      {/* Top label */}
      <div className="panel-label">
        <span>{panel.emoji}</span>
        <span>{panel.name || panel.label}</span>
      </div>

      {/* Expand/collapse button */}
      <button className="expand-btn" onClick={handleExpand} title={isExpanded ? '縮小' : '大画面'}>
        {isExpanded ? '✕' : '⛶'}
      </button>

      {/* Video */}
      {videoId ? (
        <div id={divId} className="yt-embed" />
      ) : (
        <div className="panel-empty">
          <span className="panel-empty-icon">{panel.emoji}</span>
          <span className="panel-empty-sub">URL未設定</span>
        </div>
      )}

      {/* Bottom offset controls — always visible on touch, hover-only on desktop (see CSS) */}
      <div className="panel-offset-bar" onClick={(e) => e.stopPropagation()}>
        <button className="off-btn" onClick={(e) => handleOffset(-10, e)}>-10s</button>
        <button className="off-btn" onClick={(e) => handleOffset(-1, e)}>-1s</button>
        <span className="off-val">
          {panel.offset === 0 ? 'offset 0s' : panel.offset > 0 ? `+${panel.offset}s` : `${panel.offset}s`}
        </span>
        <button className="off-btn" onClick={(e) => handleOffset(1, e)}>+1s</button>
        <button className="off-btn" onClick={(e) => handleOffset(10, e)}>+10s</button>
      </div>
    </div>
  )
})

export default VideoPanel
