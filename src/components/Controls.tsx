import { useStore } from '../store'
import { Layout } from '../types'

interface Props {
  onTogglePlay: () => void
  onSkip: (delta: number) => void
  onSpeedChange: (rate: number) => void
  onQualityChange: (q: string) => void
  onAddMemo: () => void
  onVolumeChange: (index: number, volume: number) => void
  onSolo: (index: number) => void
  onMuteAll: () => void
  onLayoutChange: (l: Layout) => void
  onShare: () => void
}

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]
const QUALITIES = [
  { value: 'default', label: '自動' },
  { value: 'medium',  label: '360p' },
  { value: 'large',   label: '480p' },
  { value: 'hd720',   label: '720p' },
  { value: 'hd1080',  label: '1080p' },
  { value: 'highres', label: '4K' },
]

export default function Controls({
  onTogglePlay,
  onSkip,
  onSpeedChange,
  onQualityChange,
  onAddMemo,
  onLayoutChange,
  onShare,
}: Props) {
  const { isPlaying, playbackRate, quality, layout } = useStore()

  return (
    <div className="controls">
      {/* Skip back */}
      <button className="ctrl-btn" onClick={() => onSkip(-30)} title="-30秒">«30</button>
      <button className="ctrl-btn" onClick={() => onSkip(-10)} title="-10秒">«10</button>

      {/* Play/Pause */}
      <button className="ctrl-btn play-btn" onClick={onTogglePlay}>
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Skip forward */}
      <button className="ctrl-btn" onClick={() => onSkip(10)} title="+10秒">10»</button>
      <button className="ctrl-btn" onClick={() => onSkip(30)} title="+30秒">30»</button>

      {/* Speed */}
      <select
        className="speed-select"
        value={playbackRate}
        onChange={(e) => onSpeedChange(Number(e.target.value))}
        title="再生速度"
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s}>{s}x</option>
        ))}
      </select>

      {/* Memo */}
      <button className="ctrl-btn memo-add-btn" onClick={onAddMemo} title="現在時刻をメモ (M)">📍</button>

      {/* Quality */}
      <select
        className="quality-select"
        value={quality}
        onChange={(e) => onQualityChange(e.target.value)}
        title="画質"
      >
        {QUALITIES.map((q) => (
          <option key={q.value} value={q.value}>{q.label}</option>
        ))}
      </select>

      {/* Layout */}
      <select
        className="layout-select"
        value={layout}
        onChange={(e) => onLayoutChange(e.target.value as Layout)}
        title="レイアウト"
      >
        <option value="default">キラー大</option>
        <option value="focus">フォーカス</option>
        <option value="equal">均等5分割</option>
      </select>

      {/* Share */}
      <button className="ctrl-btn share-btn" onClick={onShare} title="共有リンクを生成"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        🔗 共有
      </button>
    </div>
  )
}
