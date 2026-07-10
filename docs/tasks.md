# tasks.md

## フェーズ構成

| フェーズ | 内容 | 状態 | マイルストーン |
|---------|------|------|--------------|
| Phase 1: 開発基盤整備 | CI/CD・ワークフロー・開発環境の整備 | 完了 | [milestone/1](https://github.com/ot-nemoto/classmethod-pricing-chart/milestone/1) |
| Phase 2: ドキュメント整備 | CLAUDE.md に準拠したドキュメント構成の整備 | 進行中 | [milestone/2](https://github.com/ot-nemoto/classmethod-pricing-chart/milestone/2) |
| Phase 3: 機能拡張 | 今後の機能追加・改善 | 未着手 | [milestone/3](https://github.com/ot-nemoto/classmethod-pricing-chart/milestone/3) |

## Phase 1: 開発基盤整備（完了）

- [T1] CI ワークフローの追加 → Issue #1
- [T2] GitHub Pages デプロイワークフローの更新 → Issue #2
- [T3] develop→master 自動 PR ワークフローの追加 → Issue #3
- [T4] バージョン自動バンプワークフローの追加 → Issue #4
- [T5] リリース自動作成ワークフローの追加 → Issue #5
- [T6] Dependabot npm パッケージ自動更新設定の追加 → Issue #6
- [T7] CLAUDE.md の配置 → Issue #7
- [T8] devcontainer.json の更新 → Issue #8
- [T9] vitest の導入とテストコードの追加 → Issue #9

## Phase 2: ドキュメント整備（進行中）

- [T10] docs/product.md の作成 → Issue #14
- [T11] docs/requirements.md の作成 → Issue #15
- [T12] docs/architecture.md の作成 → Issue #16
- [T13] docs/ui.md の作成 → Issue #17
- [T14] docs/development.md の作成 → Issue #18
- [T15] docs/testing.md の作成 → Issue #19
- [T16] docs/e2e-scenarios.md の作成 → Issue #20
- [T17] docs/infra.md の作成 → Issue #21
- [T18] docs/tasks.md の作成 → Issue #22
- [T19] README.md の整備 → Issue #23
- [T20] アカウントフィルター全解除時にグラフが消えない不具合を修正 → Issue #25
- [T21] E2E テストの実施 → Issue #27
- [T28] 複数ファイル同時ドロップ時に新規アカウント・月がフィルターで自動選択されない → Issue #28
- [T29] product_name / cost カラム欠損 CSV アップロード時に警告が表示されない → Issue #29
- [T30] production 依存関係を更新（Next.js を除く） → Issue #33
- [T31] Next.js 15→16 メジャーアップグレード → Issue #34
- [T32] TypeScript 6 への対応（CSS side-effect import 型宣言追加） → Issue #36
- [T33] chart.js 4.5.1 の型変更に対応（chartRef の型を修正） → Issue #38
- [T34] E2E テストの再実施 → Issue #41
- [T35] アップロードファイル件数カウンターのラベル修正 → Issue #42
- [T36] Biome 2.5.0 へのアップグレードと biome.json 移行 → Issue #61
- [T37] ドキュメントブラッシュアップ（バージョン番号・実装決定事項・タスク一覧の更新） → Issue #72
