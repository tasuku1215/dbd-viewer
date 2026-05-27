/**
 * レイアウト E2E テスト
 *
 * YouTube IFrame API はモック済み。実際の動画は読み込まず、
 * パネルの配置・サイズ・スクロール有無だけを検証する。
 */
import { test, expect, Page } from '@playwright/test'

// ── YouTube IFrame API モック ────────────────────────────────────────
async function injectYTMock(page: Page) {
  await page.addInitScript(() => {
    const mockPlayer = {
      playVideo: () => {},
      pauseVideo: () => {},
      seekTo: () => {},
      getCurrentTime: () => 0,
      getDuration: () => 600,
      setPlaybackRate: () => {},
      setPlaybackQuality: () => {},
      setVolume: () => {},
      mute: () => {},
      unMute: () => {},
    }
    ;(window as any).YT = {
      Player: function (_el: string, opts: any) {
        // onReady を非同期で呼んで player を渡す
        setTimeout(() => opts?.events?.onReady?.({ target: mockPlayer }), 50)
        return mockPlayer
      },
      PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
    }
    ;(window as any).onYouTubeIframeAPIReady?.()
  })
}

// ── セットアップ画面でビューアーを開く ─────────────────────────────
async function openViewer(page: Page) {
  await page.goto('/')
  await injectYTMock(page)

  // URLフィールド（type="url"）にキラーのダミーURLを入力してビューアーを起動
  await page.locator('input[type="url"]').first().fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  await page.locator('.start-btn').click()
  // ビューアーが表示されるまで待つ
  await page.waitForSelector('.panels-container')
}

// ════════════════════════════════════════════════════════════════════
// 1. セットアップ画面
// ════════════════════════════════════════════════════════════════════
test.describe('セットアップ画面', () => {
  test('タイトルが表示される', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.setup-header h1')).toBeVisible()
  })

  test('5枚のパネルカードが表示される', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.setup-card')).toHaveCount(5)
  })

  test('URLが空のとき開始ボタンが無効', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.start-btn')).toBeDisabled()
  })

  test('キラーURLを入力すると開始ボタンが有効になる', async ({ page }) => {
    await page.goto('/')
    await page.locator('input[type="url"]').first().fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await expect(page.locator('.start-btn')).toBeEnabled()
  })
})

// ════════════════════════════════════════════════════════════════════
// 2. ビューア – デスクトップレイアウト
// ════════════════════════════════════════════════════════════════════
test.describe('ビューア – デスクトップ', () => {
  test('パネルコンテナが表示される', async ({ page }) => {
    await openViewer(page)
    await expect(page.locator('.panels-container')).toBeVisible()
  })

  test('killer-wrap と survivor-row が存在する', async ({ page }) => {
    await openViewer(page)
    await expect(page.locator('.killer-wrap')).toBeVisible()
    await expect(page.locator('.survivor-row')).toBeVisible()
  })

  test('コントロールバーが表示される', async ({ page }) => {
    await openViewer(page)
    await expect(page.locator('.controls-bar')).toBeVisible()
  })

  test('ボリューム行が表示される', async ({ page }) => {
    await openViewer(page)
    await expect(page.locator('.volume-row')).toBeVisible()
  })

  test('ページがスクロールしない（overflow hidden）', async ({ page }) => {
    await openViewer(page)
    const scrollY = await page.evaluate(() => document.documentElement.scrollHeight)
    const viewportH = page.viewportSize()!.height
    // scrollHeight はビューポート高さと同じかそれ以下であるべき
    expect(scrollY).toBeLessThanOrEqual(viewportH + 5) // 5px の誤差許容
  })
})

// ════════════════════════════════════════════════════════════════════
// 3. ビューア – モバイルレイアウト（今回のバグ再現テスト）
// ════════════════════════════════════════════════════════════════════
test.describe('ビューア – モバイル', () => {
  test('ページがスクロールしない', async ({ page }) => {
    await openViewer(page)
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    const viewportH = page.viewportSize()!.height
    expect(scrollHeight).toBeLessThanOrEqual(viewportH + 5)
  })

  test('killer-wrap がビューポート幅の 56% 前後の高さを持つ（16:9）', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'モバイル専用テスト（デスクトップは grid ベースのレイアウト）')
    await openViewer(page)
    const vw = page.viewportSize()!.width
    const box = await page.locator('.killer-wrap').boundingBox()
    expect(box).not.toBeNull()
    // 56.25vw ± 5px
    expect(box!.height).toBeGreaterThan(vw * 0.56 - 5)
    expect(box!.height).toBeLessThan(vw * 0.57 + 5)
  })

  test('survivor-row が正確に 2列 × 2行（4セル）を持つ', async ({ page }) => {
    await openViewer(page)
    const panels = page.locator('.survivor-row .video-panel')
    await expect(panels).toHaveCount(4)
  })

  test('survivor-row の各パネルがほぼ同じ高さ（均等分割）', async ({ page }) => {
    await openViewer(page)
    const panels = page.locator('.survivor-row .video-panel')
    const boxes = await panels.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().height)
    )
    const heights = boxes.filter((h) => h > 0)
    expect(heights.length).toBeGreaterThan(0)
    const min = Math.min(...heights)
    const max = Math.max(...heights)
    // 全パネルの高さが ±5px 以内に収まること
    expect(max - min).toBeLessThanOrEqual(5)
  })

  test('コントロールバーがビューポート内に収まっている', async ({ page }) => {
    await openViewer(page)
    const viewportH = page.viewportSize()!.height
    const box = await page.locator('.controls-bar').boundingBox()
    expect(box).not.toBeNull()
    // controls-bar の下端がビューポートを超えないこと
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewportH + 5)
  })

  test('ボリューム行がビューポート内に収まっている', async ({ page }) => {
    await openViewer(page)
    const viewportH = page.viewportSize()!.height
    const box = await page.locator('.volume-row').boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewportH + 5)
  })
})

// ════════════════════════════════════════════════════════════════════
// 4. 共有モーダル
// ════════════════════════════════════════════════════════════════════
test.describe('共有モーダル', () => {
  test('共有ボタンを押すとモーダルが開く', async ({ page }) => {
    await openViewer(page)
    await page.locator('.share-btn').click()
    await expect(page.locator('.modal-overlay')).toBeVisible()
  })

  test('Escape キーでモーダルが閉じる', async ({ page }) => {
    await openViewer(page)
    await page.locator('.share-btn').click()
    await expect(page.locator('.modal-overlay')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.modal-overlay')).not.toBeVisible()
  })
})
