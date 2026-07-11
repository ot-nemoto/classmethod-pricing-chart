# サービス別の月次料金チャート

[![Pages](https://github.com/ot-nemoto/classmethod-pricing-chart/actions/workflows/deploy-github-pages.yml/badge.svg)](https://github.com/ot-nemoto/classmethod-pricing-chart/actions/workflows/deploy-github-pages.yml)
[![License](https://img.shields.io/github/license/ot-nemoto/classmethod-pricing-chart)](https://github.com/ot-nemoto/classmethod-pricing-chart/blob/master/LICENSE)

Classmethod 社の AWS 請求 CSV レポートをブラウザにアップロードするだけで、サービス別・アカウント別のコストを月次・年次で可視化できるアプリケーションです。

## 機能

- CSV ドラッグ＆ドロップでの複数アカウント・複数月データの取り込み
- サービス別 / アカウント別の集計モード切り替え
- 月次 / 年次の時間軸切り替え
- アカウント・年月・サービスの絞り込みフィルター（Top10 対応）
- 選択条件に応じたリアルタイム合計金額表示

## ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [docs/product.md](docs/product.md) | プロダクトの目的・対象ユーザー・成功指標 |
| [docs/architecture.md](docs/architecture.md) | 技術スタック・アーキテクチャ方針・環境変数 |
| [docs/ui.md](docs/ui.md) | 画面仕様・入出力契約・UI 規約 |
| [docs/development.md](docs/development.md) | ローカルセットアップ・npm スクリプト・デプロイ手順・リリースフロー |

> タスク・進捗は [GitHub Issues](https://github.com/ot-nemoto/classmethod-pricing-chart/issues) / [Milestones](https://github.com/ot-nemoto/classmethod-pricing-chart/milestones) で管理しています。

## クイックスタート

```bash
npm install
npm run dev
```

詳細は [docs/development.md](docs/development.md) を参照。
