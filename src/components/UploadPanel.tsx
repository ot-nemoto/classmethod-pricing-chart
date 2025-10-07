"use client";

import type { ChangeEvent, DragEvent, RefObject } from "react";

export default function UploadPanel({
  fileInputRef,
  onFileChange,
  onBrowseClick,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragActive,
  isParsing,
  errorMessage,
  warnings,
  sortedMonths,
  onClearReports,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  onBrowseClick: () => void;
  onDragOver: (e: DragEvent<HTMLElement>) => void;
  onDragLeave: (e: DragEvent<HTMLElement>) => void;
  onDrop: (e: DragEvent<HTMLElement>) => Promise<void> | void;
  isDragActive: boolean;
  isParsing: boolean;
  errorMessage: string | null;
  warnings: string[];
  sortedMonths: string[];
  onClearReports: () => void;
}) {
  return (
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
          onChange={onFileChange}
          className="sr-only"
        />
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onBrowseClick();
          }}
          onDragEnter={onDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
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
          <p className="text-sm text-indigo-300">ファイルを解析しています…</p>
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
              onClick={onClearReports}
              className="rounded-md border border-slate-700 px-3 py-1 font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800/80"
            >
              クリア
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
