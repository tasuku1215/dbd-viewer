import { useStore } from '../store'
import { parseShareUrl, shareDataToPanels } from '../utils/share'
import { useEffect } from 'react'

const LS_KEY = 'dbd-viewer-panels'

export default function SetupScreen() {
  const { panels, updatePanel, setIsSetup, setPanels, setInitialTime, setIsPlaying } = useStore()

  // 起動時: URL params > localStorage > デフォルト
  useEffect(() => {
    const data = parseShareUrl()
    if (data) {
      setPanels(shareDataToPanels(data))
      setInitialTime(data.t)
      return
    }
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) setPanels(JSON.parse(saved))
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // panels 変更時に localStorage へ保存
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(panels))
  }, [panels])

  const canStart = panels.some((p) => p.url.trim() !== '')

  function handleStart() {
    setIsPlaying(false)
    setIsSetup(false)
  }

  return (
    <div className="setup">
      <header className="setup-header">
        <h1>🔪 DBD 5視点 同期ビューワー</h1>
        <p>各視点のYouTubeアーカイブURLを入力してください（1つ以上で開始できます）</p>
      </header>

      <div className="setup-grid">
        {panels.map((panel, i) => (
          <div key={panel.role} className={`setup-card ${panel.role === 'killer' ? 'killer-card' : 'survivor-card'}`}>
            <div className="setup-card-label">
              <span className="setup-emoji">{panel.emoji}</span>
              <span className="setup-role">{panel.label}</span>
            </div>

            <input
              className="setup-input"
              type="text"
              placeholder="配信者名（任意）"
              value={panel.name}
              onChange={(e) => updatePanel(i, { name: e.target.value })}
            />

            <input
              className="setup-input url-input"
              type="url"
              placeholder="https://youtu.be/..."
              value={panel.url}
              onChange={(e) => updatePanel(i, { url: e.target.value })}
            />

            <div className="setup-offset-row">
              <label className="setup-offset-label">オフセット（秒）</label>
              <input
                className="setup-offset-input"
                type="number"
                step="1"
                value={panel.offset}
                onChange={(e) => updatePanel(i, { offset: Number(e.target.value) })}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="setup-footer">
        <p className="setup-hint">
          💡 オフセット：配信開始時刻がキラーと異なる場合に調整（例：キラーより3秒遅れて開始したサバイバーは <code>+3</code>）
        </p>
        <button
          className="start-btn"
          disabled={!canStart}
          onClick={handleStart}
        >
          ▶ 視聴スタート
        </button>
      </div>
    </div>
  )
}
