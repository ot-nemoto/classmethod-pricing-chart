"use client";

import type { Dispatch, SetStateAction } from "react";

export default function AccountSelector({
  filteredAccounts,
  selectedAccounts,
  toggleAccount,
  selectAllAccounts,
  clearSelectedAccounts,
  accountFilter,
  setAccountFilter,
}: {
  filteredAccounts: string[];
  selectedAccounts: string[];
  toggleAccount: (acc: string) => void;
  selectAllAccounts: () => void;
  clearSelectedAccounts: () => void;
  accountFilter: string;
  setAccountFilter: Dispatch<SetStateAction<string>>;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 w-full">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300">アカウントを選択</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAllAccounts}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-200 border border-slate-800 bg-slate-900/30"
          >
            全部
          </button>
          <button
            type="button"
            onClick={clearSelectedAccounts}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-200 border border-slate-800 bg-slate-900/10"
          >
            解除
          </button>
        </div>
      </div>
      <div className="mt-3">
        <input
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          placeholder="検索..."
          className="w-full rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400"
        />
      </div>
      <div className="mt-3 max-h-36 overflow-y-auto">
        <ul className="space-y-2">
          {filteredAccounts.map((acc) => {
            const checked = selectedAccounts.includes(acc);
            return (
              <li key={acc} className="flex items-center">
                <label className="flex items-center gap-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAccount(acc)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-400"
                  />
                  <span className="truncate max-w-[12rem]">{acc}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
