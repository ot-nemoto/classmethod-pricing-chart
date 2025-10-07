"use client";

import type { Chart as ChartJS } from "chart.js";
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
}: {
  data: ChartRow[];
  services: string[];
  onLegendClick?: (service: string) => void;
  showLegend?: boolean;
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
            display: showLegend,
            position: "bottom",
            labels: {
              boxHeight: 12,
              boxWidth: 12,
            },
            onClick(_e, legendItem, _legend) {
              const label = legendItem.text as string;
              if (onLegendClick) {
                onLegendClick(label);
              }
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
  }, [colors, data, services, onLegendClick, showLegend]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
