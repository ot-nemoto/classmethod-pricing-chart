# development.md

## ローカルセットアップ

### 前提条件

- Node.js 24 以上
- npm 10 以上

### 手順

```bash
# リポジトリをクローン
git clone https://github.com/ot-nemoto/classmethod-pricing-chart.git
cd classmethod-pricing-chart

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセスする。

### Dev Container を使う場合

`.devcontainer/devcontainer.json` が設定済みのため、VS Code の「Reopen in Container」または GitHub Codespaces で即座に開発環境が起動する。
Node.js 24・Claude Code・GitHub CLI がプリインストールされる。

## 環境変数

| 変数名 | 値 | 設定方法 |
|--------|-----|---------|
| `BUILD_MODE` | `static` | `npm run build:static` で自動設定。手動設定不要 |

`.env` ファイルは不要。

## npm スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動（http://localhost:3000） |
| `npm run build` | SSR 対応の本番ビルドを生成 |
| `npm run build:static` | GitHub Pages 向け静的エクスポートを生成（`out/` に出力） |
| `npm run start` | `npm run build` 後のアプリを起動 |
| `npm run lint` | Biome による静的解析・フォーマットチェック |
| `npm run format` | Biome によるコード自動フォーマット |
| `npm test` | Vitest によるユニットテスト実行 |
| `npm run test:watch` | Vitest をウォッチモードで実行 |
| `npm run test:coverage` | カバレッジレポートを生成 |

## デプロイ手順

デプロイは GitHub Actions が自動で行う（各ワークフローの実トリガー・処理内容は `.github/workflows/*.yml` を正とする）。

| 環境 | ブランチ | 用途 |
|------|---------|------|
| 開発 | `develop` | 機能開発・GitHub Pages デプロイ元 |
| 本番 | `master` | リリース管理・バージョンタグ |

### 自動デプロイ（通常運用）

`develop` ブランチに push するだけで GitHub Pages へ自動デプロイされる。

### 手動トリガー

GitHub Actions の画面から `deploy-github-pages.yml` を手動実行できる:

1. Actions タブ →「Deploy to GitHub Pages」→「Run workflow」

### 手動で静的ビルドを確認する場合

```bash
npm run build:static
# out/ ディレクトリに静的ファイルが生成される
npx serve out/
```

## リリースフロー

1. `develop` で開発・PR マージを繰り返す
2. 毎朝 6:00 JST に `auto-pr-to-master.yml` が差分を検出し `develop → master` の PR を自動作成・更新
3. PR に `bump:minor`（新機能）または `bump:patch`（修正）ラベルが付く
4. ラベル付与を検知した `bump-version.yml` がバージョンをバンプし、バンプコミットをブランチへ push
5. PR をマージすると `master` への push で `release.yml` が GitHub Release を自動作成

## 必要なシークレット

| シークレット名 | 用途 | 登録場所 |
|--------------|------|---------|
| `AUTO_PR_TOKEN` | `auto-pr-to-master.yml` で PR 作成に使用する PAT | Settings > Secrets and variables > Actions |
