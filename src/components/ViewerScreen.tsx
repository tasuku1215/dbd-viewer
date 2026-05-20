import { useEffect, useRef, useCallback, useState } from 'react'
import { useStore } from '../store'
import VideoPanel from './VideoPanel'
import Controls from './Controls'
import SeekBar from './SeekBar'
import ShareModal from './ShareModal'

const SYNC_INTERVAL_MS = 200
const SYNC_THRESHOLD_S = 0.5

export default function ViewerScreen() {
  const {
    panels,
    isPlaying,
    layout,
    focusedPanel,
    expandedPanel,
    showShareModal,
    initialTime,
    setCurrentTime,
    setDuration,
    setFocusedPanel,
    setExpandedPanel,
    setLayout,
    updatePanel,
    addMemo,
  } = useStore()

  const playersRef = useRef<(YT.Player | null)[]>(new Array(5).fill(null))
  const syncTimerRef = useRef<number | null>(null)
  const seekingRef = useRef(false)

  // ── resizable split ────────────────────────────────────────────────────────
  const [splitPct, setSplitPct] = useState(60)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizingRef = useRef(false)

  function handleResizeDown(e: React.PointerEvent) {
    resizingRef.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  function handleResizeMove(e: React.PointerEvent) {
    if (!resizingRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct = ((e.clientY - rect.top) / rect.height) * 100
    setSplitPct(Math.min(85, Math.max(15, pct)))
  }
  function handleResizeUp() { resizingRef.current = false }

  // ── time helpers ───────────────────────────────────────────────────────────
  // "logical time" = killer's raw playback time − killer's offset
  // All players: raw time = logicalTime + panel.offset
  const getMaster = () => playersRef.current[0]

  const getLogicalTime = useCallback((): number => {
    const master = getMaster()
    if (master) return master.getCurrentTime() - panels[0].offset
    return useStore.getState().currentTime
  }, [panels])

  /** Seek all players to logicalTime (= common timeline position) */
  const seekAll = useCallback((logicalTime: number) => {
    panels.forEach((p, i) => {
      playersRef.current[i]?.seekTo(logicalTime + p.offset, true)
    })
    setCurrentTime(logicalTime)
  }, [panels, setCurrentTime])

  /** Sync loop: keep survivors aligned to killer, updating currentTime */
  const syncPlayers = useCallback(() => {
    const master = getMaster()
    if (!master) return
    const logicalTime = master.getCurrentTime() - panels[0].offset
    setCurrentTime(logicalTime)
    const dur = master.getDuration()
    if (dur > 0) setDuration(dur)

    panels.forEach((p, i) => {
      if (i === 0) return
      const player = playersRef.current[i]
      if (!player) return
      const expected = logicalTime + p.offset
      const actual = player.getCurrentTime()
      if (Math.abs(actual - expected) > SYNC_THRESHOLD_S) {
        player.seekTo(expected, true)
      }
    })
  }, [panels, setCurrentTime, setDuration])

  // ── sync loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) {
      if (syncTimerRef.current) { clearInterval(syncTimerRef.current); syncTimerRef.current = null }
      return
    }
    syncTimerRef.current = window.setInterval(() => {
      if (!seekingRef.current) syncPlayers()
    }, SYNC_INTERVAL_MS)
    return () => { if (syncTimerRef.current) clearInterval(syncTimerRef.current) }
  }, [isPlaying, syncPlayers])

  // ── player callbacks ───────────────────────────────────────────────────────
  const handlePlayerReady = useCallback((index: number, player: YT.Player) => {
    playersRef.current[index] = player

    if (index === 0 && initialTime > 0) {
      player.seekTo(initialTime + panels[0].offset, true)
      setCurrentTime(initialTime)
      const dur = player.getDuration()
      if (dur > 0) setDuration(dur)
    } else {
      const master = getMaster()
      if (master) {
        const logicalTime = master.getCurrentTime() - panels[0].offset
        player.seekTo(logicalTime + panels[index].offset, true)
      }
    }

    // Apply quality and start if already playing
    const { isPlaying: playing, playbackRate, quality } = useStore.getState()
    player.setPlaybackQuality(quality)
    if (playing) {
      player.setPlaybackRate(playbackRate)
      player.playVideo()
    }
  }, [initialTime, panels, setCurrentTime, setDuration])

  const handlePlayerDestroy = useCallback((index: number) => {
    playersRef.current[index] = null
  }, [])

  // ── offset change ──────────────────────────────────────────────────────────
  function handleOffsetChange(index: number, delta: number) {
    const newOffset = panels[index].offset + delta
    updatePanel(index, { offset: newOffset })
    const player = playersRef.current[index]
    if (!player) return
    const killerOffset = index === 0 ? newOffset : panels[0].offset
    const logicalTime = (getMaster()?.getCurrentTime() ?? useStore.getState().currentTime) - killerOffset
    player.seekTo(logicalTime + newOffset, true)
  }

  // ── playback controls ──────────────────────────────────────────────────────
  function togglePlay() {
    const { isPlaying: cur, playbackRate } = useStore.getState()
    const next = !cur
    useStore.getState().setIsPlaying(next)
    playersRef.current.forEach((p) => {
      if (!p) return
      if (next) { p.setPlaybackRate(playbackRate); p.playVideo() }
      else p.pauseVideo()
    })
  }

  function handleSeekStart() {
    seekingRef.current = true
    if (isPlaying) playersRef.current.forEach((p) => p?.pauseVideo())
  }

  function handleSeekEnd(logicalTime: number) {
    seekAll(logicalTime)
    seekingRef.current = false
    if (isPlaying) setTimeout(() => {
      const { playbackRate } = useStore.getState()
      playersRef.current.forEach((p) => { p?.setPlaybackRate(playbackRate); p?.playVideo() })
    }, 300)
  }

  function handleSkip(delta: number) {
    const logical = getLogicalTime()
    seekAll(logical + delta)
    if (useStore.getState().isPlaying) setTimeout(() => playersRef.current.forEach((p) => p?.playVideo()), 200)
  }

  // ── keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      switch (e.key) {
        case ' ':          e.preventDefault(); togglePlay(); break
        case 'ArrowLeft':  e.preventDefault(); handleSkip(e.shiftKey ? -30 : -10); break
        case 'ArrowRight': e.preventDefault(); handleSkip(e.shiftKey ? 30 : 10); break
        case 'm': case 'M':
          addMemo(useStore.getState().currentTime); break
        case 'Escape':
          if (useStore.getState().expandedPanel !== null) useStore.getState().setExpandedPanel(null)
          else if (useStore.getState().showShareModal) useStore.getState().setShowShareModal(false)
          break
        default:
          if (e.key >= '1' && e.key <= '5') {
            const idx = parseInt(e.key) - 1
            const cur = useStore.getState().expandedPanel
            useStore.getState().setExpandedPanel(cur === idx ? null : idx)
          }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSpeedChange(rate: number) {
    useStore.getState().setPlaybackRate(rate)
    playersRef.current.forEach((p) => p?.setPlaybackRate(rate))
  }

  function handleQualityChange(quality: string) {
    useStore.getState().setQuality(quality)
    playersRef.current.forEach((p) => p?.setPlaybackQuality(quality))
  }

  function handleVolumeChange(index: number, volume: number) {
    const player = playersRef.current[index]
    if (!player) return
    volume === 0 ? player.mute() : (player.unMute(), player.setVolume(volume))
  }

  function handleSolo(index: number) {
    playersRef.current.forEach((p, i) => {
      if (!p) return
      i === index ? (p.unMute(), p.setVolume(100)) : p.mute()
    })
  }

  function handleMuteAll() { playersRef.current.forEach((p) => p?.mute()) }

  // ── layout ─────────────────────────────────────────────────────────────────
  const isEqual = layout === 'equal'
  const gridRows = isEqual ? '1fr 1fr' : `${splitPct}fr 6px ${100 - splitPct}fr`

  return (
    <div className={`viewer ${isEqual ? 'layout-equal' : ''}`}>
      <button className="back-btn" onClick={() => useStore.getState().setIsSetup(true)}>
        ← 設定に戻る
      </button>

      <div
        ref={containerRef}
        className="panels-container"
        style={{ gridTemplateRows: gridRows }}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
      >
        <div className={`killer-wrap ${focusedPanel === 0 ? 'panel-focused' : ''}`}>
          <VideoPanel
            panel={panels[0]} index={0}
            isFocused={focusedPanel === 0}
            isExpanded={expandedPanel === 0}
            onClick={() => setFocusedPanel(0)}
            onPlayerReady={handlePlayerReady}
            onPlayerDestroy={handlePlayerDestroy}
            onOffsetChange={handleOffsetChange}
            onToggleExpand={() => setExpandedPanel(expandedPanel === 0 ? null : 0)}
          />
        </div>

        {!isEqual && (
          <div className="resize-handle" onPointerDown={handleResizeDown}>
            <div className="resize-grip" />
          </div>
        )}

        <div className="survivor-row">
          {[1, 2, 3, 4].map((i) => (
            <VideoPanel
              key={panels[i].role}
              panel={panels[i]} index={i}
              isFocused={focusedPanel === i}
              isExpanded={expandedPanel === i}
              onClick={() => setFocusedPanel(i)}
              onPlayerReady={handlePlayerReady}
              onPlayerDestroy={handlePlayerDestroy}
              onOffsetChange={handleOffsetChange}
              onToggleExpand={() => setExpandedPanel(expandedPanel === i ? null : i)}
            />
          ))}
        </div>
      </div>

      <div className="controls-bar">
        <SeekBar onSeekStart={handleSeekStart} onSeekEnd={handleSeekEnd} />
        <Controls
          onTogglePlay={togglePlay}
          onSkip={handleSkip}
          onSpeedChange={handleSpeedChange}
          onQualityChange={handleQualityChange}
          onAddMemo={() => addMemo(useStore.getState().currentTime)}
          onVolumeChange={handleVolumeChange}
          onSolo={handleSolo}
          onMuteAll={handleMuteAll}
          onLayoutChange={setLayout}
          onShare={() => useStore.getState().setShowShareModal(true)}
        />
      </div>

      <div className="volume-row">
        {panels.map((p, i) => (
          <div key={p.role} className="volume-item">
            <span className="volume-label">{p.emoji}{p.name || p.label}</span>
            <input
              type="range" min={0} max={100}
              defaultValue={i === 0 ? 100 : 0}
              className="volume-slider"
              onChange={(e) => handleVolumeChange(i, Number(e.target.value))}
            />
            <button className="solo-btn" onClick={() => handleSolo(i)}>solo</button>
          </div>
        ))}
        <button className="mute-all-btn" onClick={handleMuteAll}>🔇 全消音</button>
      </div>

      {showShareModal && <ShareModal />}
    </div>
  )
}
