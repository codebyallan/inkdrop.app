export interface IExecutiveSummaryResponse {
  totalPages: number;
  avgFleetHealth: number;
  topConsumerPrinter: string;
  criticalTonerCount: number;
}

export interface IReportSeries {
  label: string;
  data: number[];
  color?: string;
}

export interface IReportResponse {
  labels: string[];
  datasets: IReportSeries[];
  summary: {
    totalValue: number;
    averageConsumption: number;
    trend: 'up' | 'down' | 'stable';
    unit: string;
  };
}

export interface IReportFilters {
  startDate: Date | null;
  endDate: Date | null;
  printerId?: string;
}

export interface IPredictiveMetric {
  printerId: string;
  printerName: string;
  color: string;
  estimatedDaysRemaining: number;
  estimatedDate: string;
  confidence: number;
}

// ── New: printed-pages endpoint ──────────────────────────────────────────────

export interface IPrinterPageBreakdown {
  printerId: string;
  printerName: string;
  totalPages: number;
  monoPages: number | null;
  colorPages: number | null;
}

export interface IPrintedPagesResponse {
  totalPages: number;
  monoPages: number | null;
  colorPages: number | null;
  periodStart: string;
  periodEnd: string;
  byPrinter: IPrinterPageBreakdown[];
}
