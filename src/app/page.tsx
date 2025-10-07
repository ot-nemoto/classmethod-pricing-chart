"use client";

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
import AccountSelector from "@/components/AccountSelector";
import MonthSelector from "@/components/MonthSelector";
import ServiceSelector from "@/components/ServiceSelector";
import StackedBarChart from "@/components/StackedBarChart";
import UploadPanel from "@/components/UploadPanel";

type MonthlyReport = {
  month: string;
  services: Record<string, number>;
  total: number;
  fileName: string;
  accountId?: string;
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

const extractAccountFromFileName = (fileName: string): string | null => {
  const match = fileName.match(/monthly-report-\d{4}-\d{2}-(\d+)\.csv$/);
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
    const accountId = extractAccountFromFileName(file.name) ?? undefined;

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
            accountId,
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

// chart rendering moved to components/StackedBarChart

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // allow multiple reports per month (different AWS accounts)
  const [reportsByMonth, setReportsByMonth] = useState<
    Record<string, MonthlyReport[]>
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
          const updated: Record<string, MonthlyReport[]> = { ...prev };

          nextReports.forEach((report) => {
            const arr = [...(updated[report.month] ?? [])];
            const key = report.accountId ?? report.fileName;
            const existingIndex = arr.findIndex(
              (r) => (r.accountId ?? r.fileName) === key,
            );
            if (existingIndex >= 0) {
              arr[existingIndex] = report;
            } else {
              arr.push(report);
            }
            updated[report.month] = arr;
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

  // removed activeView/year view (内訳 section) per user request

  // derive list of accounts (accountId or fallback to fileName)
  const accounts = useMemo(() => {
    const set = new Set<string>();
    Object.values(reportsByMonth).forEach((arr) => {
      (arr ?? []).forEach((r) => {
        set.add(r.accountId ?? r.fileName);
      });
    });
    return Array.from(set).sort();
  }, [reportsByMonth]);

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [accountFilter, setAccountFilter] = useState("");
  const hasInitializedAccounts = useRef(false);
  useEffect(() => {
    if (!hasInitializedAccounts.current && accounts.length > 0) {
      setSelectedAccounts([...accounts]);
      hasInitializedAccounts.current = true;
    }
  }, [accounts]);

  const toggleAccount = useCallback((acc: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(acc) ? prev.filter((a) => a !== acc) : [...prev, acc],
    );
  }, []);
  const selectAllAccounts = useCallback(
    () => setSelectedAccounts([...accounts]),
    [accounts],
  );
  const clearSelectedAccounts = useCallback(() => setSelectedAccounts([]), []);

  const filteredAccounts = useMemo(() => {
    const term = accountFilter.trim().toLowerCase();
    return accounts.filter((s) =>
      term === "" ? true : s.toLowerCase().includes(term),
    );
  }, [accounts, accountFilter]);

  // chart data: aggregate services across reports for the selected accounts per month
  const chartData = useMemo<ChartRow[]>(() => {
    return sortedMonths.map((month) => {
      const arr = reportsByMonth[month] ?? [];
      const services: Record<string, number> = {};
      const allowed = new Set(selectedAccounts);
      (arr ?? []).forEach((r) => {
        const key = r.accountId ?? r.fileName;
        if (selectedAccounts.length > 0 && !allowed.has(key)) return;
        Object.entries(r.services).forEach(([svc, cost]) => {
          services[svc] = (services[svc] ?? 0) + cost;
        });
      });
      return { month, services };
    });
  }, [reportsByMonth, sortedMonths, selectedAccounts]);

  const services = useMemo(() => {
    const totals = new Map<string, number>();
    const allowed = new Set(selectedAccounts);

    Object.values(reportsByMonth).forEach((arr) => {
      (arr ?? []).forEach((report) => {
        const key = report.accountId ?? report.fileName;
        if (selectedAccounts.length > 0 && !allowed.has(key)) return;
        Object.entries(report.services).forEach(([service, cost]) => {
          totals.set(service, (totals.get(service) ?? 0) + (cost as number));
        });
      });
    });

    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([service]) => service);
  }, [reportsByMonth, selectedAccounts]);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceFilter, setServiceFilter] = useState("");
  // default: select all services when services first become available
  const hasInitializedServices = useRef(false);
  useEffect(() => {
    if (!hasInitializedServices.current && services.length > 0) {
      setSelectedServices([...services]);
      hasInitializedServices.current = true;
    }
  }, [services]);

  const toggleService = useCallback((service: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(service)) {
        return prev.filter((s) => s !== service);
      }
      return [...prev, service];
    });
  }, []);

  const selectAllServices = useCallback(
    () => setSelectedServices([...services]),
    [services],
  );
  const clearSelectedServices = useCallback(() => setSelectedServices([]), []);
  const selectTop10 = useCallback(
    () => setSelectedServices(services.slice(0, 10)),
    [services],
  );

  const filteredServices = useMemo(() => {
    const term = serviceFilter.trim().toLowerCase();
    return services.filter((s) =>
      term === "" ? true : s.toLowerCase().includes(term),
    );
  }, [services, serviceFilter]);

  const displayedServices = useMemo(() => {
    // Do not fallback to all services when nothing is selected.
    // If user clears all, displayedServices should be empty.
    return selectedServices;
  }, [selectedServices]);

  // Months selection (年月) - default: all selected
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState("");

  // default: select all months when months first become available
  const hasInitializedMonths = useRef(false);
  useEffect(() => {
    if (!hasInitializedMonths.current && sortedMonths.length > 0) {
      setSelectedMonths([...sortedMonths]);
      hasInitializedMonths.current = true;
    }
  }, [sortedMonths]);

  const toggleMonth = useCallback((month: string) => {
    setSelectedMonths((prev) => {
      if (prev.includes(month)) return prev.filter((m) => m !== month);
      return [...prev, month];
    });
  }, []);

  const selectAllMonths = useCallback(
    () => setSelectedMonths([...sortedMonths]),
    [sortedMonths],
  );
  const clearSelectedMonths = useCallback(() => setSelectedMonths([]), []);

  const filteredMonths = useMemo(() => {
    const term = monthFilter.trim().toLowerCase();
    return sortedMonths.filter((m) =>
      term === "" ? true : m.toLowerCase().includes(term),
    );
  }, [sortedMonths, monthFilter]);

  const displayedMonths = useMemo(() => {
    // Do not fallback to all months when nothing is selected.
    return selectedMonths;
  }, [selectedMonths]);

  // filter chartData by selected months
  const filteredChartData = useMemo(() => {
    if (displayedMonths.length === 0) return [];
    const setMonths = new Set(displayedMonths);
    return chartData.filter((row) => setMonths.has(row.month));
  }, [chartData, displayedMonths]);

  /*
  const yearlyAggregation = useMemo(() => {
    const years: Record<
      string,
      { services: Record<string, number>; total: number; months: string[] }
    > = {};

    Object.entries(reportsByMonth).forEach(([month, arr]) => {
      const year = month.split("-")[0];
      if (!years[year]) {
        years[year] = { services: {}, total: 0, months: [] };
      }

      years[year].months.push(month);

      const allowed = new Set(selectedAccounts);
      (arr ?? []).forEach((report) => {
        const key = report.accountId ?? report.fileName;
        if (selectedAccounts.length > 0 && !allowed.has(key)) return;
        years[year].total += report.total as number;
        Object.entries(report.services).forEach(([service, cost]) => {
          years[year].services[service] =
            (years[year].services[service] ?? 0) + (cost as number);
        });
      });
    });

    const sortedYears = Object.keys(years).sort((a, b) => a.localeCompare(b));

    return sortedYears.map((year) => ({ year, ...years[year] }));
  }, [reportsByMonth]);

  // yearly aggregation retained for other uses, but year-specific chart/memo removed
  */

  const totalCost = useMemo(() => {
    // sum of costs for currently selected months, services and accounts
    if (!displayedMonths || displayedMonths.length === 0) return 0;
    if (!displayedServices || displayedServices.length === 0) return 0;
    if (!selectedAccounts || selectedAccounts.length === 0) return 0;

    const allowed = new Set(selectedAccounts);
    let sum = 0;
    for (const month of displayedMonths) {
      const arr = reportsByMonth[month] ?? [];
      for (const report of arr) {
        const key = report.accountId ?? report.fileName;
        if (selectedAccounts.length > 0 && !allowed.has(key)) continue;
        for (const service of displayedServices) {
          sum += Number(report.services[service] ?? 0);
        }
      }
    }
    return sum;
  }, [reportsByMonth, displayedMonths, displayedServices, selectedAccounts]);

  return (
    <div className="min-h-screen bg-slate-950 pb-16 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 pt-16 sm:px-6 md:px-10">
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
        <UploadPanel
          fileInputRef={fileInputRef}
          onFileChange={handleFileSelection}
          onBrowseClick={handleBrowseClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          isDragActive={isDragActive}
          isParsing={isParsing}
          errorMessage={errorMessage}
          warnings={warnings}
          sortedMonths={sortedMonths}
          onClearReports={clearReports}
        />

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-inner shadow-slate-950/50">
          <div className="flex flex-col gap-6">
            <div className="flex w-full items-start justify-between gap-6">
              <div className="flex-1 space-y-4">
                <h2 className="text-lg font-semibold text-slate-100">
                  集計サマリ
                </h2>
                <p className="text-sm text-slate-300">
                  合計 {sortedMonths.length}{" "}
                  ヶ月分のデータを取り込み、サービス数は {services.length}{" "}
                  件です。
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 sm:w-56">
                    <div className="text-sm text-slate-300">合計金額</div>
                    <div className="mt-2 text-3xl font-bold text-slate-50">
                      {currencyFormatter.format(totalCost)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-start gap-3">
                <AccountSelector
                  filteredAccounts={filteredAccounts}
                  selectedAccounts={selectedAccounts}
                  toggleAccount={toggleAccount}
                  selectAllAccounts={selectAllAccounts}
                  clearSelectedAccounts={clearSelectedAccounts}
                  accountFilter={accountFilter}
                  setAccountFilter={setAccountFilter}
                />
                {/* latest month display removed per request */}
                <ServiceSelector
                  filteredServices={filteredServices}
                  selectedServices={selectedServices}
                  toggleService={toggleService}
                  selectAllServices={selectAllServices}
                  selectTop10={selectTop10}
                  clearSelectedServices={clearSelectedServices}
                  serviceFilter={serviceFilter}
                  setServiceFilter={setServiceFilter}
                />
                <MonthSelector
                  filteredMonths={filteredMonths}
                  selectedMonths={selectedMonths}
                  toggleMonth={toggleMonth}
                  selectAllMonths={selectAllMonths}
                  clearSelectedMonths={clearSelectedMonths}
                  monthFilter={monthFilter}
                  setMonthFilter={setMonthFilter}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40 w-full">
              {filteredChartData.length === 0 ||
              displayedServices.length === 0 ? (
                <div className="flex h-80 w-full items-center justify-center text-sm text-slate-400">
                  まずは CSV ファイルをアップロードしてください。
                </div>
              ) : (
                <div className="h-[480px] w-full">
                  <StackedBarChart
                    data={filteredChartData}
                    services={displayedServices}
                    onLegendClick={toggleService}
                    showLegend={false}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
