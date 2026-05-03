import { describe, expect, it } from "vitest";
import {
  extractAccountFromFileName,
  extractMonthFromFileName,
  normalizeCost,
} from "./csv";

describe("extractMonthFromFileName", () => {
  it("正規のファイル名から年月を抽出する", () => {
    expect(
      extractMonthFromFileName("monthly-report-2024-03-123456789012.csv"),
    ).toBe("2024-03");
  });

  it("年月部分が異なっても正しく抽出する", () => {
    expect(
      extractMonthFromFileName("monthly-report-2023-12-987654321098.csv"),
    ).toBe("2023-12");
  });

  it("パターンに一致しないファイル名は null を返す", () => {
    expect(extractMonthFromFileName("billing-2024-03.csv")).toBeNull();
    expect(extractMonthFromFileName("report.csv")).toBeNull();
    expect(extractMonthFromFileName("")).toBeNull();
  });
});

describe("extractAccountFromFileName", () => {
  it("正規のファイル名からアカウント ID を抽出する", () => {
    expect(
      extractAccountFromFileName("monthly-report-2024-03-123456789012.csv"),
    ).toBe("123456789012");
  });

  it("パターンに一致しないファイル名は null を返す", () => {
    expect(extractAccountFromFileName("monthly-report-2024-03-.csv")).toBeNull();
    expect(extractAccountFromFileName("billing.csv")).toBeNull();
    expect(extractAccountFromFileName("")).toBeNull();
  });

  it("拡張子が .csv でない場合は null を返す", () => {
    expect(
      extractAccountFromFileName("monthly-report-2024-03-123456789012.txt"),
    ).toBeNull();
  });
});

describe("normalizeCost", () => {
  it("数値文字列をそのまま変換する", () => {
    expect(normalizeCost("123.45")).toBe(123.45);
  });

  it("ドル記号を除去して変換する", () => {
    expect(normalizeCost("$123.45")).toBe(123.45);
  });

  it("カンマを除去して変換する", () => {
    expect(normalizeCost("1,234.56")).toBe(1234.56);
  });

  it("ドル記号とカンマを両方除去して変換する", () => {
    expect(normalizeCost("$1,234.56")).toBe(1234.56);
  });

  it("undefined は 0 を返す", () => {
    expect(normalizeCost(undefined)).toBe(0);
  });

  it("空文字列は 0 を返す", () => {
    expect(normalizeCost("")).toBe(0);
  });

  it("数値に変換できない文字列は 0 を返す", () => {
    expect(normalizeCost("abc")).toBe(0);
    expect(normalizeCost("-")).toBe(0);
  });

  it("0 は 0 を返す", () => {
    expect(normalizeCost("0")).toBe(0);
    expect(normalizeCost("$0.00")).toBe(0);
  });
});
