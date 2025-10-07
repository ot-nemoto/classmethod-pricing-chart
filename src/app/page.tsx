"use client";

import type { Chart as ChartJS } from "chart.js";
import Chart from "chart.js/auto";
import * as Papa from "papaparse";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type MonthlyReport = {
  month: string;
  services: Record<string, number>;
  total: number;
  fileName: string;
};

type ParseSuccess = {
  report: MonthlyReport;
  warnings: string[];
};

type ChartRow = {
  month: string;
  services: Record<string, number>;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const extractMonthFromFileName = (fileName: string): string | null => {
  const match = fileName.match(/monthly-report-(\d{4}-\d{2})-/);
  return match ? match[1] : null;
};

const normalizeCost = (value: string | undefined): number => {
  if (!value) {
    return 0;
  }
  const normalized = value.replace(/[$,]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseMonthlyReport = (file: File): Promise<ParseSuccess> =>
  new Promise((resolve, reject) => {
    const month = extractMonthFromFileName(file.name);

    if (!month) {
      reject(new Error(`ファイル名から月を特定できませんでした: ${file.name}`));
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        const services: Record<string, number> = {};
        let total = 0;

        for (const row of results.data) {
          const service = row.product_name?.trim();
          if (!service) {
            continue;
          }

          const cost = normalizeCost(row.cost);
          if (cost === 0) {
            continue;
          }

          services[service] = (services[service] ?? 0) + cost;
          total += cost;
        }

        const warnings =
          results.errors.length > 0
            ? results.errors.slice(0, 5).map((error: Papa.ParseError) => {
                const rowLabel =
                  typeof error.row === "number"
                    ? `行 ${error.row}`
                    : "不明な行";
                return `「${file.name}」${rowLabel}: ${error.message}`;
              })
            : [];

        resolve({
          report: {
            month,
            services,
            total,
            fileName: file.name,
          },
          warnings,
        });
      },
      error: (error: Error) => {
        reject(
          new Error(
            `「${file.name}」の読み込みに失敗しました: ${error.message}`,
          ),
        );
      },
    });
  });

const generateColor = (index: number) => {
  const hue = (index * 59) % 360;
  return `hsl(${hue} 70% 52%)`;
};

function StackedBarChart({
  data,
  services,
}: {
  data: ChartRow[];
  services: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartJS | null>(null);

  const colors = useMemo(
    () => services.map((_, index) => generateColor(index)),
    [services],
  );

  useEffect(() => {
    const canvasElement = canvasRef.current;

    if (!canvasElement) {
      return;
    }

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    if (data.length === 0 || services.length === 0) {
      return;
    }

    const chart = new Chart(canvasElement, {
      type: "bar",
      data: {
        labels: data.map((row) => row.month),
        datasets: services.map((service, index) => ({
          label: service,
          data: data.map((row) => Number(row.services[service] ?? 0)),
          backgroundColor: colors[index],
          borderColor: colors[index],
          borderWidth: 1,
        })),
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        scales: {
          x: {
            stacked: true,
            ticks: {
              autoSkip: false,
            },
          },
          y: {
            stacked: true,
            ticks: {
              callback(value) {
                return currencyFormatter.format(Number(value));
              },
            },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxHeight: 12,
              boxWidth: 12,
            },
          },
          tooltip: {
            callbacks: {
              label(context) {
                const label = context.dataset.label ?? "";
                const rawValue = context.parsed.y ?? 0;
                return `${label}: ${currencyFormatter.format(rawValue)}`;
              },
              footer(items) {
                const total = items.reduce(
                  (sum, item) => sum + (item.parsed.y ?? 0),
                  0,
                );
                return `合計: ${currencyFormatter.format(total)}`;
              },
            },
          },
        },
      },
    });

    chartRef.current = chart;

    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, [colors, data, services]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [reportsByMonth, setReportsByMonth] = useState<
    Record<string, MonthlyReport>
  >({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setIsParsing(true);

    try {
      const results = await Promise.allSettled(
        files.map((file) => parseMonthlyReport(file)),
      );

      const nextReports: MonthlyReport[] = [];
      const nextWarnings: string[] = [];
      const failures: string[] = [];

      results.forEach((result, index) => {
        const fileName = files[index]?.name ?? "不明なファイル";

        if (result.status === "fulfilled") {
          nextReports.push(result.value.report);
          nextWarnings.push(...result.value.warnings);
        } else {
          const reason = result.reason;
          failures.push(
            reason instanceof Error
              ? reason.message
              : `「${fileName}」の取り込み中に不明なエラーが発生しました。`,
          );
        }
      });

      if (nextReports.length > 0) {
        setReportsByMonth((prev) => {
          const updated = { ...prev };
          nextReports.forEach((report) => {
            updated[report.month] = report;
          });
          return updated;
        });
      }

      setWarnings(nextWarnings.slice(0, 5));
      setErrorMessage(failures.length > 0 ? failures.join("\n") : null);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleFileSelection = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files;
      const files = fileList ? Array.from(fileList) : [];

      await processFiles(files);

      // 同じファイルを再度選択できるように値をリセット
      event.target.value = "";
    },
    [processFiles],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
      return;
    }
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDragActive(false);

      const items = event.dataTransfer?.items;
      let files: File[] = [];

      if (items) {
        files = Array.from(items)
          .filter((item) => item.kind === "file")
          .map((item) => item.getAsFile())
          .filter((file): file is File => Boolean(file));
      } else {
        files = Array.from(event.dataTransfer?.files ?? []);
      }

      await processFiles(files);
    },
    [processFiles],
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearReports = useCallback(() => {
    setReportsByMonth({});
    setWarnings([]);
    setErrorMessage(null);
  }, []);

  const sortedMonths = useMemo(
    () => Object.keys(reportsByMonth).sort((a, b) => a.localeCompare(b)),
    [reportsByMonth],
  );

  const [activeView, setActiveView] = useState<"month" | "year">("month");

  const chartData = useMemo<ChartRow[]>(
    () =>
      sortedMonths.map((month) => ({
        month,
        services: reportsByMonth[month]?.services ?? {},
      })),
    [reportsByMonth, sortedMonths],
  );

  const services = useMemo(() => {
    const totals = new Map<string, number>();

    Object.values(reportsByMonth).forEach((report) => {
      Object.entries(report.services).forEach(([service, cost]) => {
        totals.set(service, (totals.get(service) ?? 0) + cost);
      });
    });

    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([service]) => service);
  }, [reportsByMonth]);

  const yearlyAggregation = useMemo(() => {
    const years: Record<
      string,
      { services: Record<string, number>; total: number; months: string[] }
    > = {};

    Object.entries(reportsByMonth).forEach(([month, report]) => {
      const year = month.split("-")[0];
      if (!years[year]) {
        years[year] = { services: {}, total: 0, months: [] };
      }

      years[year].months.push(month);
      years[year].total += report.total;

      Object.entries(report.services).forEach(([service, cost]) => {
        years[year].services[service] =
          (years[year].services[service] ?? 0) + cost;
      });
    });

    const sortedYears = Object.keys(years).sort((a, b) => a.localeCompare(b));

    return sortedYears.map((year) => ({ year, ...years[year] }));
  }, [reportsByMonth]);

  const chartDataYears = useMemo<ChartRow[]>(() => {
    return yearlyAggregation.map((y) => ({
      month: y.year,
      services: y.services,
    }));
  }, [yearlyAggregation]);

  const servicesByYear = useMemo(() => {
    const totals = new Map<string, number>();
    yearlyAggregation.forEach((y) => {
      Object.entries(y.services).forEach(([service, cost]) => {
        totals.set(service, (totals.get(service) ?? 0) + cost);
      });
    });
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([service]) => service);
  }, [yearlyAggregation]);

  const totalCost = useMemo(
    () =>
      Object.values(reportsByMonth).reduce(
        (sum, report) => sum + report.total,
        0,
      ),
    [reportsByMonth],
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-16 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 pt-16 sm:px-6 md:px-10">
        <header className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-lg shadow-slate-950/40">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            サービス別の月次料金チャート
          </h1>
          <p className="text-base text-slate-300">
            CSV
            月次レポートをアップロードすると、サービスごとの料金を集計し、月ごとの積み上げ棒グラフとして可視化します。
            同じ画面で複数月を比較できます。
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-inner shadow-slate-950/40">
          <div className="flex flex-col gap-4">
            <label
              className="text-sm font-medium text-slate-200"
              htmlFor="csv-upload"
            >
              月次 CSV ファイルを追加
            </label>
            <input
              ref={fileInputRef}
              id="csv-upload"
              type="file"
              accept=".csv,text/csv"
              multiple
              onChange={handleFileSelection}
              className="sr-only"
            />
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                handleBrowseClick();
              }}
              onDragEnter={handleDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500/80 ${isDragActive ? "border-indigo-400 bg-indigo-500/10" : "border-slate-700 bg-slate-950/50 hover:border-indigo-400/70 hover:bg-slate-950/60"}`}
            >
              <p className="text-sm font-medium text-slate-100">
                ここに CSV ファイルをドラッグ＆ドロップ
              </p>
              <p className="text-xs text-slate-400">
                またはクリックしてファイルを選択（複数可）
              </p>
              <span className="rounded-md border border-indigo-500/70 bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/30">
                ファイルを選択
              </span>
            </button>
            {isParsing && (
              <p className="text-sm text-indigo-300">
                ファイルを解析しています…
              </p>
            )}
            {errorMessage && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                {errorMessage.split("\n").map((line, index) => {
                  const messageKey = `${line}-${index}`;
                  return <p key={messageKey}>{line}</p>;
                })}
              </div>
            )}
            {warnings.length > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
                <p className="font-semibold">警告</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            {sortedMonths.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span>{sortedMonths.length} 件の月次レポートを表示中</span>
                <button
                  type="button"
                  onClick={clearReports}
                  className="rounded-md border border-slate-700 px-3 py-1 font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800/80"
                >
                  クリア
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-inner shadow-slate-950/50 md:grid-cols-[2fr_3fr] md:gap-10">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">集計サマリ</h2>
            <p className="text-sm text-slate-300">
              合計 {sortedMonths.length} ヶ月分のデータを取り込み、サービス数は{" "}
              {services.length} 件です。
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="text-sm text-slate-300">合計金額</div>
              <div className="mt-2 text-3xl font-bold text-slate-50">
                {currencyFormatter.format(totalCost)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="text-sm text-slate-300">最新の月</div>
              <div className="mt-2 text-2xl font-semibold text-slate-50">
                {sortedMonths.length > 0
                  ? sortedMonths[sortedMonths.length - 1]
                  : "—"}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
            {chartData.length === 0 || services.length === 0 ? (
              <div className="flex h-80 w-full items-center justify-center text-sm text-slate-400">
                まずは CSV ファイルをアップロードしてください。
              </div>
            ) : (
              <div className="h-[420px] w-full">
                <StackedBarChart data={chartData} services={services} />
              </div>
            )}
          </div>
        </section>

        {sortedMonths.length > 0 && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-inner shadow-slate-950/50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">内訳</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView("month")}
                  className={`rounded-md px-3 py-1 text-sm font-medium ${activeView === "month" ? "bg-indigo-500/20 text-indigo-200" : "text-slate-300 border border-slate-800"}`}
                >
                  月別
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView("year")}
                  className={`rounded-md px-3 py-1 text-sm font-medium ${activeView === "year" ? "bg-indigo-500/20 text-indigo-200" : "text-slate-300 border border-slate-800"}`}
                >
                  年別
                </button>
              </div>
            </div>

            {activeView === "month" ? (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-sm">
                  <thead className="bg-slate-950/80">
                    <tr className="text-left text-slate-300">
                      <th className="px-4 py-3 font-medium">月</th>
                      <th className="px-4 py-3 font-medium">ファイル名</th>
                      <th className="px-4 py-3 font-medium text-right">
                        サービス数
                      </th>
                      <th className="px-4 py-3 font-medium text-right">
                        合計金額
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sortedMonths.map((month) => {
                      const report = reportsByMonth[month];
                      const serviceCount = Object.keys(
                        report?.services ?? {},
                      ).length;
                      return (
                        <tr key={month} className="text-slate-200">
                          <td className="px-4 py-3 font-medium">{month}</td>
                          <td className="px-4 py-3 text-slate-400">
                            {report?.fileName}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {serviceCount}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {currencyFormatter.format(report?.total ?? 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 space-y-6">
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
                  {chartDataYears.length === 0 ||
                  servicesByYear.length === 0 ? (
                    <div className="flex h-56 w-full items-center justify-center text-sm text-slate-400">
                      年別データがありません
                    </div>
                  ) : (
                    <div className="h-[320px] w-full">
                      <StackedBarChart
                        data={chartDataYears}
                        services={servicesByYear}
                      />
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="min-w-full divide-y divide-slate-800 text-sm">
                    <thead className="bg-slate-950/80">
                      <tr className="text-left text-slate-300">
                        <th className="px-4 py-3 font-medium">年</th>
                        <th className="px-4 py-3 font-medium">月数</th>
                        <th className="px-4 py-3 font-medium text-right">
                          サービス数
                        </th>
                        <th className="px-4 py-3 font-medium text-right">
                          合計金額
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {yearlyAggregation.map((y) => (
                        <tr key={y.year} className="text-slate-200">
                          <td className="px-4 py-3 font-medium">{y.year}</td>
                          <td className="px-4 py-3 text-slate-400">
                            {y.months.length}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {Object.keys(y.services).length}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {currencyFormatter.format(y.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
