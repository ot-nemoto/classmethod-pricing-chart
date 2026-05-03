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

デプロイは GitHub Actions が自動で行う。詳細は [docs/infra.md](infra.md) を参照。

### 手動で静的ビルドを確認する場合

```bash
npm run build:static
# out/ ディレクトリに静的ファイルが生成される
npx serve out/
```
