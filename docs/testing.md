# testing.md

## テスト種別

| 種別 | ツール | 対象 |
|------|--------|------|
| ユニットテスト | Vitest 3 | `src/lib/` 配下のユーティリティ関数 |
| E2E テスト | 未導入（手動確認） | 画面操作シナリオ（[docs/e2e-scenarios.md](e2e-scenarios.md) 参照） |

UI コンポーネントのユニットテストは必須としない。

## 完了条件

- `src/lib/` 配下のユーティリティ関数はユニットテストの作成をもって実装完了とする
- テストが全通過することを確認してからコミットする

## カバレッジ方針

| 対象 | 方針 |
|------|------|
| `src/lib/csv.ts` | 全関数の正常系・異常系・境界値をカバーする |
| `src/components/` | テスト必須としない |
| `src/app/page.tsx` | テスト必須としない（UI ロジックは手動確認で代替） |

## 実行手順

```bash
# 全テストを実行
npm test

# ウォッチモード（開発時）
npm run test:watch

# カバレッジレポートを生成（coverage/ ディレクトリに出力）
npm run test:coverage
```

## 現在のテスト一覧

| ファイル | テスト対象 | ケース数 |
|---------|-----------|---------|
| `src/lib/csv.test.ts` | `extractMonthFromFileName` / `extractAccountFromFileName` / `normalizeCost` | 14 |
