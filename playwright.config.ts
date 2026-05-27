import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',

  use: {
    // ローカルの dev server に向ける
    baseURL: 'http://localhost:5173',
    // YouTube IFrame はモックするので実際のネット不要
    actionTimeout: 5_000,
  },

  // テスト前に vite dev server を起動
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },

  projects: [
    // デスクトップ Chrome
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    // iPhone 14 相当 - Chromium でモバイルエミュレーション（WebKit 不要）
    {
      name: 'mobile-ios',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    },
    // Android 相当
    {
      name: 'mobile-android',
      use: {
        browserName: 'chromium',
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
})
