# CLAUDE.md

開発の共通規約は `.claude/common-rules.md`（dev-commons から同期）に集約している。本ファイルはそれをインポートし、**このリポジトリ固有の情報のみ**を記載する。

@.claude/common-rules.md

---

## 作業開始時のチェックリスト

1. `docs/product.md` を読みプロダクトの目的・対象ユーザーを理解する
2. `docs/architecture.md` で技術スタック・アーキテクチャ方針・バージョン固有の実装決定を確認する
3. `docs/ui.md` で画面仕様・入出力契約・UI 規約を確認する
4. `docs/development.md` で開発・デプロイ手順を確認する
5. タスクの状態は [GitHub Issues](https://github.com/ot-nemoto/classmethod-pricing-chart/issues) で確認する

## 本リポジトリのドキュメント採否

- **必須ドキュメントのみ**（`product` / `architecture` / `ui` / `development`）。
- **条件付き必須ドキュメントは該当なし**。CSV を取り込んでクライアント側で集計・可視化するサーバーレス・クライアント完結の SPA（GitHub Pages 配信）で、外部 REST API / Server Actions / 永続化 DB / 認証フロー / 外部サービス連携のいずれも持たないため、`api.md` / `actions.md` / `schema.md` / `auth.md` / `integrations.md` はいずれも不要。デプロイ（GitHub Pages）手順は `development.md` に集約する。

## テスト対象（このリポジトリ固有）

- ユニットテスト対象: `src/lib/`（純粋関数のユーティリティ。CSV パース等）
- API ルートは持たない（クライアント完結）
- 手動動作確認用の CSV フィクスチャは `tests/fixtures/` に管理する
- CI: PR 作成時（develop / master 宛）に `ci.yml` が `npm run lint` と `npm run test` を自動実行する
