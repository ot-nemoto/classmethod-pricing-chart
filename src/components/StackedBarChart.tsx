"use client";

import type { Chart as ChartJS, ChartOptions, Plugin } from "chart.js";
import Chart from "chart.js/auto";
import { useEffect, useMemo, useRef } from "react";

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

const generateColor = (index: number) => {
  const hue = (index * 59) % 360;
  return `hsl(${hue} 70% 52%)`;
};

export default function StackedBarChart({
  data,
  services,
  onLegendClick,
  showLegend = true,
  sumPosition = "top",
}: {
  data: ChartRow[];
  services: string[];
  onLegendClick?: (service: string) => void;
  showLegend?: boolean;
  sumPosition?: "top" | "bottom";
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartJS | null>(null);

  const colors = useMemo(
    () => services.map((_, index) => generateColor(index)),
    [services],
  );

  useEffect(() => {
    const canvasElement = canvasRef.current;

    if (!canvasElement) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    if (data.length === 0 || services.length === 0) return;

    const stackedTotalsPlugin: Plugin<"bar"> = {
      id: "stackedTotals",
      afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        if (!ctx) return;

        const labels = chart.data.labels ?? [];
        const datasets = chart.data.datasets ?? [];
        if (datasets.length === 0) return;

        labels.forEach((_, idx) => {
          const elems: Array<{ x: number; y: number; base: number }> = [];
          for (let dsIdx = 0; dsIdx < datasets.length; dsIdx += 1) {
            const meta = chart.getDatasetMeta(dsIdx as number) as unknown as {
              data?: Array<{ x: number; y: number; base: number }>;
            };
            const el = meta?.data?.[idx];
            if (el) elems.push({ x: el.x, y: el.y, base: el.base });
          }
          if (elems.length === 0) return;

          const total = datasets.reduce((sum, ds) => {
            const arr = ds.data as unknown as Array<number>;
            const val = Number(arr?.[idx] ?? 0);
            return sum + (Number.isFinite(val) ? val : 0);
          }, 0);

          const yTop = Math.min(...elems.map((z) => z.y));
          const yBottom = Math.max(...elems.map((z) => z.base));
          const x = elems[0].x;

          ctx.save();
          ctx.fillStyle = "#e6edf3";
          ctx.font = "600 12px Inter, ui-sans-serif, system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";

          const text = currencyFormatter.format(total);
          const pos =
            (
              chart.options as unknown as {
                plugins?: { stackedTotals?: { position?: string } };
              }
            )?.plugins?.stackedTotals?.position ??
            sumPosition ??
            "top";
          let yPos = yTop - 6;
          if (pos === "bottom") {
            ctx.textBaseline = "top";
            yPos = yBottom + 6;
          }
          ctx.fillText(text, x, yPos);
          ctx.restore();
        });
      },
    };

    const chartOptions = {
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        x: { stacked: true, ticks: { autoSkip: false } },
        y: {
          stacked: true,
          ticks: {
            callback(value: number | string) {
              return currencyFormatter.format(Number(value));
            },
          },
          beginAtZero: true,
        },
      },
      plugins: {
        stackedTotals: { position: sumPosition },
        legend: {
          display: showLegend,
          position: "bottom",
          labels: { boxHeight: 12, boxWidth: 12 },
          onClick(
            _e: unknown,
            legendItem: { text?: string },
            _legend: unknown,
          ) {
            const label = legendItem.text ?? "";
            if (onLegendClick && label) onLegendClick(label);
          },
        },
        tooltip: {
          callbacks: {
            label(context: {
              dataset?: { label?: string };
              parsed?: { y?: number };
            }) {
              const label = context.dataset?.label ?? "";
              const rawValue = context.parsed?.y ?? 0;
              return `${label}: ${currencyFormatter.format(rawValue)}`;
            },
            footer(items: Array<{ parsed?: { y?: number } }>) {
              const total = items.reduce(
                (sum: number, item) => sum + (item.parsed?.y ?? 0),
                0,
              );
              return `合計: ${currencyFormatter.format(total)}`;
            },
          },
        },
      },
    } as unknown as ChartOptions<"bar"> & {
      plugins?: { stackedTotals?: { position?: string } };
    };

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
      options: chartOptions,
      plugins: [stackedTotalsPlugin],
    });

    chartRef.current = chart;

    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, [colors, data, services, onLegendClick, showLegend, sumPosition]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
