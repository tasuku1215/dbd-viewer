import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
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
    volumes,
    setLayout,
  } = useStore()

  const playersRef = useRef<(YT.Player | null)[]>(new Array(5).fill(null))
  const syncTimerRef = useRef<number | null>(null)
  const seekingRef  = useRef(false)
  const skipTimerRef = useRef<number | null>(null)   // H5: prevents rapid-skip timer collision

  // ── resizable split ─────────────────────────────────────────────────────────
  const [splitPct, setSplitPct] = useState(60)
  const containerRef  = useRef<HTMLDivElement>(null)
  const resizingRef   = useRef(false)

  function handleResizeDown(e: React.PointerEvent) {
    resizingRef.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  function handleResizeMove(e: React.PointerEvent) {
    if (!resizingRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct  = ((e.clientY - rect.top) / rect.height) * 100
    setSplitPct(Math.min(85, Math.max(15, pct)))
  }
  function handleResizeUp() { resizingRef.current = false }

  // ── time helpers (C3: all read live state via getState() — no stale closures) ──
  const getMaster = () => playersRef.current[0]

  /** logical time = killer raw − killer offset */
  const getLogicalTime = useCallback((): number => {
    const master = getMaster()
    if (master) return master.getCurrentTime() - useStore.getState().panels[0].offset
    return useStore.getState().currentTime
  }, []) // stable: no closed-over state

  /** Seek all players to the given logical time */
  const seekAll = useCallback((logicalTime: number) => {
    const { panels: p, setCurrentTime } = useStore.getState()
    p.forEach((panel, i) => {
      playersRef.current[i]?.seekTo(logicalTime + panel.offset, true)
    })
    setCurrentTime(logicalTime)
  }, []) // stable

  /** Sync loop — C3: stable; reads fresh state each tick via getState() */
  const syncPlayers = useCallback(() => {
    const state  = useStore.getState()
    const master = getMaster()
    if (!master) return
    const logicalTime = master.getCurrentTime() - state.panels[0].offset
    state.setCurrentTime(logicalTime)
    const dur = master.getDuration()
    if (dur > 0) state.setDuration(dur)

    state.panels.forEach((p, i) => {
      if (i === 0) return
      const player = playersRef.current[i]
      if (!player) return
      const expected = logicalTime + p.offset
      if (Math.abs(player.getCurrentTime() - expected) > SYNC_THRESHOLD_S) {
        player.seekTo(expected, true)
      }
    })
  }, []) // stable — no deps on React state

  // ── sync loop ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) {
      if (syncTimerRef.current) { clearInterval(syncTimerRef.current); syncTimerRef.current = null }
      return
    }
    syncTimerRef.current = window.setInterval(() => {
      if (!seekingRef.current) syncPlayers()
    }, SYNC_INTERVAL_MS)
    return () => { if (syncTimerRef.current) clearInterval(syncTimerRef.current) }
  }, [isPlaying, syncPlayers]) // syncPlayers is now stable → interval never restarts spuriously

  // ── player callbacks ──────────────────────────────────────────────────────────
  const handlePlayerReady = useCallback((index: number, player: YT.Player) => {
    playersRef.current[index] = player

    const state = useStore.getState()

    if (index === 0 && state.initialTime > 0) {
      player.seekTo(state.initialTime + state.panels[0].offset, true)
      state.setCurrentTime(state.initialTime)
      const dur = player.getDuration()
      if (dur > 0) state.setDuration(dur)
    } else {
      const master = getMaster()
      if (master) {
        const logicalTime = master.getCurrentTime() - state.panels[0].offset
        player.seekTo(logicalTime + state.panels[index].offset, true)
      }
    }

    // Apply initial volume from store
    const vol = state.volumes[index]
    if (vol === 0) { player.mute() }
    else           { player.unMute(); player.setVolume(vol) }

    if (state.isPlaying) {
      player.setPlaybackRate(state.playbackRate)
      player.playVideo()
    }
  }, []) // stable

  const handlePlayerDestroy = useCallback((index: number) => {
    playersRef.current[index] = null
  }, [])

  // ── offset change (H3: reads fresh state, handles killer-changes correctly) ──
  const handleOffsetChange = useCallback((index: number, delta: number) => {
    const state     = useStore.getState()
    const newOffset = state.panels[index].offset + delta
    state.updatePanel(index, { offset: newOffset })

    const killerRaw = playersRef.current[0]?.getCurrentTime() ?? state.currentTime

    if (index === 0) {
      // Killer offset changed → logical time shifts → re-sync all survivors
      const newLogicalTime = killerRaw - newOffset
      state.setCurrentTime(newLogicalTime)
      state.panels.forEach((p, i) => {
        if (i === 0) return
        playersRef.current[i]?.seekTo(newLogicalTime + p.offset, true)
      })
    } else {
      // Survivor offset changed → re-seek just this survivor
      const logicalTime = killerRaw - state.panels[0].offset
      playersRef.current[index]?.seekTo(logicalTime + newOffset, true)
    }
  }, []) // stable

  // ── playback controls ─────────────────────────────────────────────────────────
  function togglePlay() {
    const { isPlaying: cur, playbackRate, setIsPlaying } = useStore.getState()
    const next = !cur
    setIsPlaying(next)
    playersRef.current.forEach((p) => {
      if (!p) return
      if (next) { p.setPlaybackRate(playbackRate); p.playVideo() }
      else        p.pauseVideo()
    })
  }

  function handleSeekStart() {
    seekingRef.current = true
    if (useStore.getState().isPlaying) playersRef.current.forEach((p) => p?.pauseVideo())
  }

  function handleSeekEnd(logicalTime: number) {
    seekAll(logicalTime)
    seekingRef.current = false
    if (useStore.getState().isPlaying) setTimeout(() => {
      const { playbackRate } = useStore.getState()
      playersRef.current.forEach((p) => { p?.setPlaybackRate(playbackRate); p?.playVideo() })
    }, 300)
  }

  // H5: clear previous skip timer before setting a new one (rapid-skip safety)
  function handleSkip(delta: number) {
    const { isPlaying: playing, playbackRate } = useStore.getState()
    const logical = getLogicalTime()
    seekingRef.current = true
    if (playing) playersRef.current.forEach((p) => p?.pauseVideo())
    seekAll(logical + delta)

    if (skipTimerRef.current) clearTimeout(skipTimerRef.current)
    skipTimerRef.current = window.setTimeout(() => {
      skipTimerRef.current = null
      seekingRef.current   = false
      if (playing) {
        playersRef.current.forEach((p) => { p?.setPlaybackRate(playbackRate); p?.playVideo() })
      }
    }, 300)
  }

  // ── keyboard shortcuts (H1: all handlers use getState() — no stale closures) ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      switch (e.key) {
        case ' ':          e.preventDefault(); togglePlay(); break
        case 'ArrowLeft':  e.preventDefault(); handleSkip(e.shiftKey ? -30 : -10); break
        case 'ArrowRight': e.preventDefault(); handleSkip(e.shiftKey ? 30 : 10); break
        case 'm': case 'M':
          useStore.getState().addMemo(useStore.getState().currentTime); break
        case 'Escape':
          if (useStore.getState().expandedPanel !== null) useStore.getState().setExpandedPanel(null)
          else if (useStore.getState().showShareModal)    useStore.getState().setShowShareModal(false)
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
    useStore.getState().setQuality(quality as import('../types').VideoQuality)
  }

  // M4: update store so slider stays in sync after re-renders
  function handleVolumeChange(index: number, volume: number) {
    useStore.getState().setVolume(index, volume)
    const player = playersRef.current[index]
    if (!player) return
    volume === 0 ? player.mute() : (player.unMute(), player.setVolume(volume))
  }

  function handleSolo(index: number) {
    panels.forEach((_, i) => {
      const p = playersRef.current[i]
      if (!p) return
      if (i === index) { p.unMute(); p.setVolume(100); useStore.getState().setVolume(i, 100) }
      else             { p.mute();                      useStore.getState().setVolume(i, 0) }
    })
  }

  function handleMuteAll() {
    playersRef.current.forEach((p, i) => {
      p?.mute()
      useStore.getState().setVolume(i, 0)
    })
  }

  // C4: stable panel callbacks — created once; onToggleExpand reads expandedPanel
  //     via getState() so no re-creation needed when expandedPanel changes
  const panelCallbacks = useMemo(() => [0, 1, 2, 3, 4].map((i) => ({
    onClick:        () => useStore.getState().setFocusedPanel(i),
    onToggleExpand: () => {
      const cur = useStore.getState().expandedPanel
      useStore.getState().setExpandedPanel(cur === i ? null : i)
    },
  })), []) // stable for the lifetime of this component

  // ── layout ───────────────────────────────────────────────────────────────────
  const isEqual  = layout === 'equal'
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
            onClick={panelCallbacks[0].onClick}
            onPlayerReady={handlePlayerReady}
            onPlayerDestroy={handlePlayerDestroy}
            onOffsetChange={handleOffsetChange}
            onToggleExpand={panelCallbacks[0].onToggleExpand}
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
              onClick={panelCallbacks[i].onClick}
              onPlayerReady={handlePlayerReady}
              onPlayerDestroy={handlePlayerDestroy}
              onOffsetChange={handleOffsetChange}
              onToggleExpand={panelCallbacks[i].onToggleExpand}
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
          onAddMemo={() => useStore.getState().addMemo(useStore.getState().currentTime)}
          onVolumeChange={handleVolumeChange}
          onSolo={handleSolo}
          onMuteAll={handleMuteAll}
          onLayoutChange={setLayout}
          onShare={() => useStore.getState().setShowShareModal(true)}
        />
      </div>

      {/* M4: controlled inputs — value from store so sliders stay in sync after re-render */}
      <div className="volume-row">
        {panels.map((p, i) => (
          <div key={p.role} className="volume-item">
            <span className="volume-label">{p.emoji}{p.name || p.label}</span>
            <input
              type="range" min={0} max={100}
              value={volumes[i]}
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
