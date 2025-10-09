# サービス別の月次料金チャート

Classmethod社の AWS 請求レポート（`monthly-report-YYYY-MM-ACCOUNTID.csv`）をブラウザにドラッグ＆ドロップするだけで、アカウントやサービス別に月次コストを可視化できる Next.js 製アプリケーションです。複数アカウント・複数月の比較や年次集計をワンビューで確認できます。

## クイックスタート (Try it)

1. 依存関係をインストール:
	 ```bash
	 npm install
	 ```
2. 開発サーバーを起動:
	 ```bash
	 npm run dev
	 ```
3. ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスし、指示に従って CSV をアップロードします。

## 主な機能

- **CSV インポートの自動集計**: AWS 請求ダッシュボードでダウンロードした月次 CSV をドラッグ＆ドロップまたはファイル選択で取り込み、Papaparse で解析します。
- **複数アカウント対応**: ファイル名から AWS アカウント ID を検出し、同一月の異なるアカウントを自動でマージ。差分更新にも対応。
- **柔軟なフィルタリング**: アカウント・年月・サービスごとにチェックボックスとテキスト検索で絞り込み可能。サービスは「Top10」一括選択にも対応。
- **集計モードの切り替え**: サービス別とアカウント別の積み上げ棒グラフをワンクリックで切り替え。さらに月次／年次表示を選択できます。
- **リアルタイムの合計金額**: 選択中の条件に応じて USD で合計金額を算出し、ヘッダーに表示。
- **エラー／警告ハンドリング**: パースエラーや欠損値は画面上に通知。最大 5 件までの警告を表示します。

## 使い方の流れ

1. 画面上部のアップロードパネルに CSV ファイルをドラッグ＆ドロップします（複数同時可）。
2. 解析が完了すると、読み込まれた月一覧と全サービス数がサマリーに表示されます。
3. 左から順にアカウント・年月・サービスのフィルターで可視化したい条件を選択します。
4. 「サービス別 / アカウント別」「月次 / 年次」のトグルでグラフの軸を切り替え、積み上げ棒グラフからコスト構造を分析します。
5. 再読み込みなしで追加の CSV をアップロードしたり、「クリア」ボタンで読み込み済みデータを初期化できます。

## データ要件

- **ファイル命名規則**: `monthly-report-YYYY-MM-ACCOUNTID.csv`
	- 月の表示（例: `2024-05`）と AWS アカウント ID をファイル名から抽出します。
- **必須カラム**: `product_name`, `cost`
	- 金額は `$` や `,` を含む文字列でも自動正規化します。
- **任意カラム**: サービスによって `usage_type` や `availability_zone` など追加列が存在しても問題ありません。

## サンプルデータ

```csv
id,month,invoice_id,aws_account_id,product_name,rate_id,subscription_id,pricing_plan_id,usage_type,operation,availability_zone,reserved_instance,item_description,usage_quantity,rate,cost,resource_id,tag_value
14525160328,2021-03,726221193,114740378764,Amazon Simple Storage Service,,,,APN1-USE1-AWS-Out-Bytes,ReadBucketPublicAccessBlock,,N,$0.09 per GB - Asia Pacific (Tokyo) data transfer to US East (Northern Virginia),9.864E-7,0.0900000000,0.0000000888,cm-members-114740378764,
14525202950,2021-03,726221193,114740378764,Amazon Simple Storage Service,,,,APN1-APN2-AWS-Out-Bytes,HeadBucket,,N,$0.09 per GB - Asia Pacific (Tokyo) data transfer to Asia Pacific (Seoul),0.0000414130,0.0900000000,0.0000037245,cm-members-114740378764,
14525551518,2021-03,726221193,114740378764,Amazon Simple Storage Service,,,,APN1-Requests-Tier1,PutObject,,N,$0.0047 per 1,000 PUT, COPY, POST, or LIST requests,19835.0000000000,0.0000047000,0.0932245000,cm-members-114740378764,
14525838577,2021-03,726221193,114740378764,AWS Config,,,,APS1-ConfigurationItemRecorded,None,,N,$0.003 per  Configuration Item recorded in Asia Pacific (Singapore) region,20.0000000000,0.0030000000,0.0600000000,,
14526016199,2021-03,726221193,114740378764,Amazon Simple Storage Service,,,,USE1-EUW2-AWS-Out-Bytes,ListAllMyBuckets,,N,$0.02 per GB - US East (Northern Virginia) data transfer to EU (London),0.0000152166,0.0200000000,0.0000003024,
```

## ディレクトリ構造

```
src/
├── app/
│   ├── layout.tsx          # アプリ全体のレイアウト
│   ├── page.tsx            # CSV 解析・グラフ表示のメインページ
│   └── globals.css         # グローバルスタイル
└── components/
		├── UploadPanel.tsx     # アップロード UI と状態表示
		├── AccountSelector.tsx  # アカウントフィルター
		├── MonthSelector.tsx    # 月フィルター
		├── ServiceSelector.tsx  # サービスフィルター
		└── StackedBarChart.tsx  # Chart.js を使った積み上げ棒グラフ
```

## 技術スタック

- フレームワーク: Next.js 15 (App Router)
- 言語: TypeScript 5, React 19
- データ処理: Papaparse 5 で CSV をストリーミング解析
- グラフ描画: Chart.js 4（カスタムプラグインで合計値をオーバーレイ表示）
- スタイル: Tailwind CSS 4（`@tailwindcss/postcss` 経由）
- 開発ツール: Biome 2 (Lint/Format), cross-env

## ビルドと開発の詳細

### npm スクリプト

- `npm run dev` — 開発サーバーを起動 (http://localhost:3000)
- `npm run build` — SSR 対応の本番ビルドを生成
- `npm run build:static` — 静的エクスポート用ビルド (`BUILD_MODE=static`) を生成
- `npm run start` — `npm run build` 後のアプリを起動
- `npm run lint` — Biome による静的解析

### 静的エクスポート

GitHub Pages などの静的ホスティング向けに、以下のコマンドで `out/` フォルダを生成できます。

```bash
npm run build:static
```

生成されたファイルは `out/` に配置され、`python3 -m http.server` 等で簡易的に確認できます。

### 推奨ワークフロー

1. `npm run lint` でフォーマット・Lint を実行
2. `npm run build` または `npm run build:static` でビルド検証

## ライセンス

現時点で本リポジトリには明示的なライセンスが含まれていません。
