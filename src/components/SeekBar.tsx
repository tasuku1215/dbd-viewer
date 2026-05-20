import { useState, useRef } from 'react'
import { useStore } from '../store'
import { formatTime } from '../utils/format'

interface Props {
  onSeekStart: () => void
  onSeekEnd: (masterTime: number) => void
}

export default function SeekBar({ onSeekStart, onSeekEnd }: Props) {
  const { currentTime, duration, memos, removeMemo } = useStore()
  const [dragging, setDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverX, setHoverX] = useState(0)
  const barRef = useRef<HTMLDivElement>(null)

  const displayTime = dragging ? dragTime : currentTime
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0

  function getTimeFromEvent(e: React.MouseEvent | React.TouchEvent): number {
    if (!barRef.current || duration <= 0) return 0
    const rect = barRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return ratio * duration
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    const t = getTimeFromEvent(e as unknown as React.MouseEvent)
    setDragging(true)
    setDragTime(t)
    onSeekStart()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    const t = getTimeFromEvent(e as unknown as React.MouseEvent)
    if (dragging) setDragTime(t)
    setHoverTime(t)
    setHoverX(e.clientX - (barRef.current?.getBoundingClientRect().left ?? 0))
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!dragging) return
    const t = getTimeFromEvent(e as unknown as React.MouseEvent)
    setDragging(false)
    onSeekEnd(t)
  }

  return (
    <>
      <div className="seekbar-wrap">
        <span className="seek-time">{formatTime(displayTime)}</span>

        <div
          ref={barRef}
          className={`seekbar-track ${dragging ? 'dragging' : ''}`}
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => setHoverTime(null)}
        >
          <div className="seekbar-fill" style={{ width: `${progress}%` }} />
          <div className="seekbar-thumb" style={{ left: `${progress}%` }} />
          {memos.map((memo) => {
            const pct = duration > 0 ? (memo.time / duration) * 100 : 0
            return (
              <div
                key={memo.id}
                className="memo-marker"
                style={{ left: `${pct}%` }}
                title={formatTime(memo.time)}
                onClick={(e) => { e.stopPropagation(); onSeekEnd(memo.time) }}
                onContextMenu={(e) => { e.preventDefault(); removeMemo(memo.id) }}
              />
            )
          })}
          {hoverTime !== null && (
            <div className="seek-tooltip" style={{ left: `${Math.min(hoverX, (barRef.current?.offsetWidth ?? 200) - 40)}px` }}>
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        <span className="seek-time">{formatTime(duration)}</span>
      </div>

      {memos.length > 0 && (
        <div className="memo-list">
          {[...memos].sort((a, b) => a.time - b.time).map((memo) => (
            <button key={memo.id} className="memo-chip" onClick={() => onSeekEnd(memo.time)}>
              📍 {formatTime(memo.time)}
              <span
                className="memo-chip-remove"
                onClick={(e) => { e.stopPropagation(); removeMemo(memo.id) }}
              >×</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
