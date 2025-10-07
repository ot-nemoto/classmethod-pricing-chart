"use client";

import type { Dispatch, SetStateAction } from "react";

export default function ServiceSelector({
  filteredServices,
  selectedServices,
  toggleService,
  selectAllServices,
  selectTop10,
  clearSelectedServices,
  serviceFilter,
  setServiceFilter,
}: {
  filteredServices: string[];
  selectedServices: string[];
  toggleService: (service: string) => void;
  selectAllServices: () => void;
  selectTop10: () => void;
  clearSelectedServices: () => void;
  serviceFilter: string;
  setServiceFilter: Dispatch<SetStateAction<string>>;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 w-72">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300">サービスを選択</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAllServices}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-200 border border-slate-800 bg-slate-900/30"
          >
            全部
          </button>
          <button
            type="button"
            onClick={selectTop10}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-200 border border-slate-800 bg-indigo-500/10"
          >
            Top10
          </button>
          <button
            type="button"
            onClick={clearSelectedServices}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-200 border border-slate-800 bg-slate-900/10"
          >
            解除
          </button>
        </div>
      </div>
      <div className="mt-3">
        <input
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          placeholder="検索..."
          className="w-full rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400"
        />
      </div>
      <div className="mt-3 max-h-36 overflow-y-auto">
        <ul className="space-y-2">
          {filteredServices.map((service) => {
            const checked = selectedServices.includes(service);
            return (
              <li key={service} className="flex items-center">
                <label className="flex items-center gap-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleService(service)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-400"
                  />
                  <span className="truncate max-w-[14rem]">{service}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
