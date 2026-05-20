# DBD 5視点 同期ビューワー

Dead by Daylight のキラー1視点＋サバイバー4視点を同時再生・同期するWebアプリ。  
**完全サーバーレス・無料** (GitHub Pages でホスティング)

---

## GitHub Pages へのデプロイ（推奨）

### 1. GitHubにリポジトリを作成

1. https://github.com/new でリポジトリを作成（名前例: `dbd-viewer`）
2. **Public** に設定

### 2. コードをプッシュ

```bash
cd dbd-viewer
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/dbd-viewer.git
git push -u origin main
```

### 3. GitHub Pages を有効化

リポジトリの **Settings → Pages** を開き：

- **Source** → `GitHub Actions` を選択
- 保存すると自動でデプロイが始まる

### 4. デプロイ完了後にアクセス

```
https://あなたのユーザー名.github.io/dbd-viewer/
```

`main` ブランチにプッシュするたびに自動で再デプロイされます。

---

## ローカルで動かす（開発用）

### 必要なもの
- [Node.js](https://nodejs.org/) LTS版

```bash
cd dbd-viewer
npm install
npm run dev
# → http://localhost:5173 をブラウザで開く
```

---

## 使い方

1. **各視点のYouTube URLを入力**（1つ以上で開始可能）
2. **配信開始時刻のズレがある場合**はオフセット（秒）を調整  
   例：キラーより3秒遅れて配信開始したサバイバーは `+3`
3. **「視聴スタート」** をクリック
4. 共通コントロールバーで操作：
   - `▶/⏸` で全画面同時再生/停止
   - `«10` `10»` などで全画面を同時スキップ
   - シークバーをドラッグして任意の時刻に移動
5. **「🔗 共有」** ボタンで現在の状態（5動画URL・再生時刻・オフセット）をURLリンクにコピー

---

## 機能一覧

| 機能 | 内容 |
|------|------|
| 5画面同時再生 | キラー大 + サバイバー4小（レイアウト切替可） |
| 同期シーク | シークバーで全画面を同時に時間移動 |
| 時間スキップ | ±10s / ±30s |
| 再生速度 | 0.25x〜2x |
| 個別音量 | 各視点を個別に調整・ソロ音声切替 |
| URLリンク共有 | LZ圧縮でURLに状態を埋め込み。サーバー不要 |
| QRコード | スマホ共有用QRをクライアントで生成 |
| モバイル対応 | 縦/横画面レスポンシブ |
| コスト | **¥0/月**（GitHub Pages + YouTube API） |
