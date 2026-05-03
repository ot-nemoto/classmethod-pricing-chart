# architecture.md

## 技術スタック

| カテゴリ | 技術 | 選定理由 |
|---------|------|---------|
| フレームワーク | Next.js 15 (App Router) | 静的エクスポート対応・React 19 サポート |
| 言語 | TypeScript 5 | 型安全性・IDE サポート |
| UI | React 19 | Next.js との統合 |
| CSV パース | Papaparse 5 | ブラウザ対応・ストリーミング解析 |
| チャート | Chart.js 4 | 軽量・カスタムプラグイン対応 |
| スタイル | Tailwind CSS 4 | ユーティリティファースト・ビルドサイズ最適化 |
| Lint/Format | Biome 2 | ESLint + Prettier の代替・高速 |
| テスト | Vitest 3 | Vite ベース・TypeScript ネイティブ対応 |
| ビルド補助 | cross-env | Windows/Unix 両環境での環境変数設定 |

## ディレクトリ構成

```
classmethod-pricing-chart/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # ルートレイアウト・メタデータ
│   │   ├── page.tsx            # メイン画面（状態管理・CSV パース・集計ロジック）
│   │   └── globals.css         # Tailwind CSS インポート
│   ├── components/
│   │   ├── UploadPanel.tsx     # ファイルアップロード UI
│   │   ├── AccountSelector.tsx # アカウントフィルター
│   │   ├── MonthSelector.tsx   # 年月フィルター
│   │   ├── ServiceSelector.tsx # サービスフィルター
│   │   └── StackedBarChart.tsx # Chart.js 積み上げ棒グラフ
│   └── lib/
│       ├── csv.ts              # CSV ユーティリティ関数（純粋関数）
│       └── csv.test.ts         # csv.ts のユニットテスト
├── docs/                       # プロジェクトドキュメント
├── public/                     # 静的アセット
├── .github/
│   └── workflows/              # GitHub Actions ワークフロー
├── .devcontainer/              # Dev Container 設定
├── next.config.ts              # Next.js 設定（静的エクスポート切り替え）
├── vitest.config.ts            # Vitest 設定
├── biome.json                  # Biome Lint/Format 設定
└── package.json
```

## 環境変数

| 変数名 | 値 | 用途 |
|--------|-----|------|
| `BUILD_MODE` | `static` | 静的エクスポートモードの有効化。`npm run build:static` で自動設定される |

`BUILD_MODE=static` 時、`next.config.ts` で以下が有効になる:
- `output: "export"` — 静的ファイル生成
- `basePath: "/classmethod-pricing-chart"` — GitHub Pages サブパス対応
- `assetPrefix: "/classmethod-pricing-chart"` — アセットパス対応
- `images: { unoptimized: true }` — 静的エクスポートでの画像最適化無効化
