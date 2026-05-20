import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useStore } from '../store'
import { buildShareUrl } from '../utils/share'

export default function ShareModal() {
  const { panels, currentTime, playbackRate, setShowShareModal } = useStore()
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const url = buildShareUrl(panels, currentTime, playbackRate)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowShareModal(false)}>✕</button>

        <h2 className="modal-title">🔗 共有リンク</h2>

        <div className="share-info">
          <div className="share-badge">✅ 5動画URL</div>
          <div className="share-badge">✅ 再生時刻</div>
          <div className="share-badge">✅ オフセット設定</div>
          <div className="share-badge">✅ 再生速度</div>
        </div>

        <div className="share-url-row">
          <input
            className="share-url-input"
            type="text"
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
          />
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? '✅ コピー済' : '📋 コピー'}
          </button>
        </div>

        <div className="share-actions">
          <button className="qr-toggle-btn" onClick={() => setShowQR((v) => !v)}>
            {showQR ? 'QRを隠す' : '📱 QRコード表示'}
          </button>
        </div>

        {showQR && (
          <div className="qr-wrap">
            <QRCodeSVG value={url} size={200} />
            <p className="qr-hint">スマホで読み取ると同じ状態で開きます</p>
          </div>
        )}
      </div>
    </div>
  )
}
