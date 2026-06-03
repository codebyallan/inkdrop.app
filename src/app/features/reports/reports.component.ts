import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { DecimalPipe, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { ReportsService } from './services/reports.service';
import { ExportService, IExportData } from '../../core/services/export.service';
import {
  IReportResponse,

  IPredictiveMetric,
  IExecutiveSummaryResponse,
  IPrintedPagesResponse,
  IPrinterPageBreakdown,
} from '../../types/report.type';
import { PrintersService } from '../printer/services/printer.service';
import { TranslateModule } from '@ngx-translate/core';
import { Chart, registerables } from 'chart.js';
import { TONER_COLOR_MAP, CHART_FALLBACK_COLORS } from '../../core/constants/toner-colors.const';
import { forkJoin, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatMenuModule,
    PageLayoutComponent,
    TranslateModule,
    DecimalPipe,
    DatePipe,
    NgClass,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports implements OnInit, AfterViewInit, OnDestroy {
  private reportsService = inject(ReportsService);
  private printersService = inject(PrintersService);
  private exportService = inject(ExportService);

  // ── State ───────────────────────────────────────────────────────────────────

  public filters = this.reportsService.filters;
  public printers = this.printersService.printers;
  public executiveSummary = this.reportsService.summary;
  public printedPages = this.reportsService.printedPages;
  public tonerConsumption = this.reportsService.tonerConsumption;
  public predictions = this.reportsService.predictions;
  public loading = signal<boolean>(false);

  /** Sorted breakdown by totalPages descending for the printer table. */
  public printerBreakdown = computed<IPrinterPageBreakdown[]>(() => {
    const data = this.printedPages();
    if (!data) return [];
    return [...data.byPrinter].sort((a, b) => b.totalPages - a.totalPages);
  });

  /** True when at least one printer has mono/color breakdown data. */
  public hasPageTypeData = computed<boolean>(() =>
    this.printedPages()?.byPrinter.some(p => p.monoPages !== null) ?? false
  );

  // ── Chart ───────────────────────────────────────────────────────────────────

  private tonerChart?: Chart;

  @ViewChild('tonerChartCanvas') tonerChartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor() {
    effect(() => {
      const consumption = this.tonerConsumption();
      if (consumption && this.tonerChartCanvas) {
        this.updateTonerChart(consumption);
      }
    });

    // Fix for chart resize bug: force update on window resize
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(200),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        if (this.tonerChart) {
          this.tonerChart.resize();
        }
      });
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loading.set(true);
    this.printersService.getPrinters().subscribe({
      next: () => this.loadAllReports(),
      error: () => this.loading.set(false),
    });
  }

  ngAfterViewInit(): void {
    const consumption = this.tonerConsumption();
    if (consumption) {
      this.updateTonerChart(consumption);
    }
  }

  ngOnDestroy(): void {
    this.tonerChart?.destroy();
  }

  // ── Data loading ────────────────────────────────────────────────────────────

  loadAllReports(force = false): void {
    if (!this.reportsService.allReportsCached() || force) {
      this.loading.set(true);
    }

    forkJoin({
      summary: this.reportsService.getExecutiveSummary(force),
      pages: this.reportsService.getPrintedPages(force),
      toner: this.reportsService.getTonerConsumption(force),
      predictions: this.reportsService.getPredictiveAnalysis(force),
    }).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Filter handlers ─────────────────────────────────────────────────────────

  exportReport(format: 'json' | 'csv' | 'excel'): void {
    const data: IExportData = {
      summary: this.executiveSummary(),
      printedPages: this.printedPages(),
      tonerConsumption: this.tonerConsumption(),
      predictions: this.predictions() ?? [],
    };

    const filename = `inkdrop-report-${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'json':
        this.exportService.exportToJSON(data, filename);
        break;
      case 'csv':
        this.exportService.exportToCSV(data, filename);
        break;
      case 'excel':
        this.exportService.exportToExcel(data, filename);
        break;
    }
  }

  onFilterChange(field: 'startDate' | 'endDate', value: Date | null): void {
    this.reportsService.updateFilters({ [field]: value });
    this.loadAllReports(true);
  }

  onPrinterFilterChange(printerId: string): void {
    this.reportsService.updateFilters({
      printerId: printerId === 'all' ? undefined : printerId,
    });
    this.loadAllReports(true);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Normalizes toner color names from API to safe CSS hex colors.
   * Uses strict matching for single letters to avoid false positives (e.g., 'm' in 'amarelo').
   */
  getTonerColor(color: string): string {
    if (!color) return TONER_COLOR_MAP['_fallback'];
    const key = color.toLowerCase().trim();

    // 1. Exact match
    if (key in TONER_COLOR_MAP) return TONER_COLOR_MAP[key];

    // 2. Substring match against multi-char keys (ignores meta keys starting with '_' and single letters)
    const multiCharKeys = Object.keys(TONER_COLOR_MAP).filter(k => !k.startsWith('_') && k.length > 1);
    const substringMatch = multiCharKeys.find(k => key.includes(k));
    if (substringMatch) return TONER_COLOR_MAP[substringMatch];

    // 3. Single-letter exact match
    const singleLetterKeys = Object.keys(TONER_COLOR_MAP).filter(k => k.length === 1);
    const letterMatch = singleLetterKeys.find(k => key === k);
    if (letterMatch) return TONER_COLOR_MAP[letterMatch];

    return TONER_COLOR_MAP['_fallback'];
  }

  getTrendColor(): string {
    const trend = this.tonerConsumption()?.summary?.trend;
    if (trend === 'up') return 'var(--app-error)';
    if (trend === 'down') return 'var(--app-success)';
    return 'var(--mat-sys-outline)';
  }

  getTopConsumerLabel(): string {
    const name = this.executiveSummary()?.topConsumerPrinter;
    if (!name) return '';
    const printer = this.printers().find(p => p.name === name);
    return printer ? `${name} - ${printer.locationName ?? 'N/A'}` : name;
  }

  /**
   * Returns a share percentage string for a printer relative to the fleet total.
   * Shows '—' when fleet total is zero to avoid division-by-zero.
   */
  getSharePercent(printerTotal: number): string {
    const fleetTotal = this.printedPages()?.totalPages ?? 0;
    if (fleetTotal === 0) return '—';
    return ((printerTotal / fleetTotal) * 100).toFixed(1) + '%';
  }

  /**
   * Width (0–100) of the share bar for a given printer. Used for the inline progress bar.
   */
  getShareBarWidth(printerTotal: number): number {
    const fleetTotal = this.printedPages()?.totalPages ?? 0;
    if (fleetTotal === 0) return 0;
    return Math.round((printerTotal / fleetTotal) * 100);
  }

  // ── Chart ───────────────────────────────────────────────────────────────────

  private updateTonerChart(data: IReportResponse): void {
    if (!this.tonerChartCanvas) return;

    if (this.tonerChart) {
      this.tonerChart.data.labels = data.labels;
      this.tonerChart.data.datasets = data.datasets.map((ds, index) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.color ?? CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length],
      }));
      this.tonerChart.update();
      return;
    }

    this.tonerChart = new Chart(this.tonerChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: data.datasets.map((ds, index) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.color ?? CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length],
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, boxHeight: 12 },
          },
        },
        scales: { y: { beginAtZero: true, max: 100 } },
      },
    });
  }
}
