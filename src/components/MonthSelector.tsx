"use client";

import type { Dispatch, SetStateAction } from "react";

export default function MonthSelector({
  filteredMonths,
  selectedMonths,
  toggleMonth,
  selectAllMonths,
  clearSelectedMonths,
  monthFilter,
  setMonthFilter,
}: {
  filteredMonths: string[];
  selectedMonths: string[];
  toggleMonth: (m: string) => void;
  selectAllMonths: () => void;
  clearSelectedMonths: () => void;
  monthFilter: string;
  setMonthFilter: Dispatch<SetStateAction<string>>;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 w-full">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300">年月を選択</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAllMonths}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-200 border border-slate-800 bg-slate-900/30"
          >
            全部
          </button>
          <button
            type="button"
            onClick={clearSelectedMonths}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-200 border border-slate-800 bg-slate-900/10"
          >
            解除
          </button>
        </div>
      </div>
      <div className="mt-3">
        <input
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          placeholder="検索..."
          className="w-full rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400"
        />
      </div>
      <div className="mt-3 max-h-36 overflow-y-auto">
        <ul className="space-y-2">
          {filteredMonths.map((month) => {
            const checked = selectedMonths.includes(month);
            return (
              <li key={month} className="flex items-center gap-3">
                <label className="flex items-center gap-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMonth(month)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-400"
                  />
                  <span className="truncate max-w-[9rem]">{month}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
