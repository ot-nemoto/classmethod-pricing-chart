export const extractMonthFromFileName = (fileName: string): string | null => {
  const match = fileName.match(/monthly-report-(\d{4}-\d{2})-/);
  return match ? match[1] : null;
};

export const extractAccountFromFileName = (fileName: string): string | null => {
  const match = fileName.match(/monthly-report-\d{4}-\d{2}-(\d+)\.csv$/);
  return match ? match[1] : null;
};

export const normalizeCost = (value: string | undefined): number => {
  if (!value) {
    return 0;
  }
  const normalized = value.replace(/[$,]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
