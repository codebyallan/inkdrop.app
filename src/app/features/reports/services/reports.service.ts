import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  IReportResponse,
  IReportFilters,
  IPredictiveMetric,
  IExecutiveSummaryResponse,
  IPrintedPagesResponse,
} from '../../../types/report.type';
import { environment } from '../../../../environments/environment';
import { map, Observable, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CacheEventService } from '../../../core/services/cache-event.service';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private http = inject(HttpClient);
  private cacheEventService = inject(CacheEventService);
  private readonly baseUrl = `${environment.BASE_URL}/reports`;

  // Filters — initialized to the first and last day of the current month
  private _filters = signal<IReportFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    printerId: undefined,
  });

  public filters = this._filters.asReadonly();

  // ── Cache signals ───────────────────────────────────────────────────────────

  private _summary = signal<{ data: IExecutiveSummaryResponse | null; filters: IReportFilters | null }>({ data: null, filters: null });
  public summary = computed(() => this._summary().data);

  /** Replaces the old pageVolume (chart dataset) with the dedicated printed-pages endpoint. */
  private _printedPages = signal<{ data: IPrintedPagesResponse | null; filters: IReportFilters | null }>({ data: null, filters: null });
  public printedPages = computed(() => this._printedPages().data);

  private _tonerConsumption = signal<{ data: IReportResponse | null; filters: IReportFilters | null }>({ data: null, filters: null });
  public tonerConsumption = computed(() => this._tonerConsumption().data);

  private _predictions = signal<{ data: IPredictiveMetric[] | null; filters: IReportFilters | null }>({ data: null, filters: null });
  public predictions = computed(() => this._predictions().data ?? []);

  constructor() {
    this.cacheEventService.events$.pipe(takeUntilDestroyed()).subscribe(entity => {
      if (['printer', 'toner', 'movement'].includes(entity)) {
        this.clearCache();
      }
    });
  }

  updateFilters(filters: Partial<IReportFilters>): void {
    this._filters.update(current => ({ ...current, ...filters }));
  }

  clearCache(): void {
    this._summary.set({ data: null, filters: null });
    this._printedPages.set({ data: null, filters: null });
    this._tonerConsumption.set({ data: null, filters: null });
    this._predictions.set({ data: null, filters: null });
  }

  private isCached<T>(cache: { data: T | null; filters: IReportFilters | null }): boolean {
    const currentFilters = this._filters();
    return !!cache.data && JSON.stringify(cache.filters) === JSON.stringify(currentFilters);
  }

  allReportsCached(): boolean {
    return (
      this.isCached(this._summary()) &&
      this.isCached(this._printedPages()) &&
      this.isCached(this._tonerConsumption()) &&
      this.isCached(this._predictions())
    );
  }

  // ── API calls ───────────────────────────────────────────────────────────────

  /**
   * GET /api/reports/pages/printed
   * Returns total pages printed (fleet or per printer) for the selected period.
   * Both dates are optional — omitting them returns the full historical period.
   */
  getPrintedPages(forceRefresh = false): Observable<IPrintedPagesResponse> {
    const cache = this._printedPages();
    const requestFilters = { ...this._filters() }; // Capture filters at request time

    if (!forceRefresh && this.isCached(cache)) {
      this.http
        .get<IPrintedPagesResponse>(`${this.baseUrl}/pages/printed`, { params: this.buildParams() })
        .pipe(
          map(res => {
            // Only update cache if filters haven't changed since the request started
            if (JSON.stringify(requestFilters) === JSON.stringify(this._filters())) {
              this._printedPages.set({ data: res, filters: requestFilters });
            }
            return res;
          })
        )
        .subscribe({ error: err => console.error('Background refresh printedPages failed:', err) });

      return of(cache.data!);
    }

    const params = this.buildParams();
    return this.http
      .get<IPrintedPagesResponse>(`${this.baseUrl}/pages/printed`, { params })
      .pipe(
        map(res => {
          this._printedPages.set({ data: res, filters: requestFilters });
          return res;
        })
      );
  }

  getTonerConsumption(forceRefresh = false): Observable<IReportResponse> {
    const cache = this._tonerConsumption();
    const requestFilters = { ...this._filters() };

    if (!forceRefresh && this.isCached(cache)) {
      this.http
        .get<IReportResponse>(`${this.baseUrl}/toner/consumption`, { params: this.buildParams() })
        .pipe(
          map(res => {
            if (JSON.stringify(requestFilters) === JSON.stringify(this._filters())) {
              this._tonerConsumption.set({ data: res, filters: requestFilters });
            }
            return res;
          })
        )
        .subscribe({ error: err => console.error('Background refresh tonerConsumption failed:', err) });

      return of(cache.data!);
    }

    const params = this.buildParams();
    return this.http
      .get<IReportResponse>(`${this.baseUrl}/toner/consumption`, { params })
      .pipe(
        map(res => {
          this._tonerConsumption.set({ data: res, filters: requestFilters });
          return res;
        })
      );
  }

  getExecutiveSummary(forceRefresh = false): Observable<IExecutiveSummaryResponse> {
    const cache = this._summary();
    const requestFilters = { ...this._filters() };

    if (!forceRefresh && this.isCached(cache)) {
      this.http
        .get<IExecutiveSummaryResponse>(`${this.baseUrl}/summary`, { params: this.buildParams() })
        .pipe(
          map(res => {
            if (JSON.stringify(requestFilters) === JSON.stringify(this._filters())) {
              this._summary.set({ data: res, filters: requestFilters });
            }
            return res;
          })
        )
        .subscribe({ error: err => console.error('Background refresh executiveSummary failed:', err) });

      return of(cache.data!);
    }

    const params = this.buildParams();
    return this.http
      .get<IExecutiveSummaryResponse>(`${this.baseUrl}/summary`, { params })
      .pipe(
        map(res => {
          this._summary.set({ data: res, filters: requestFilters });
          return res;
        })
      );
  }

  getPredictiveAnalysis(forceRefresh = false): Observable<IPredictiveMetric[]> {
    const cache = this._predictions();
    const requestFilters = { ...this._filters() };

    if (!forceRefresh && this.isCached(cache)) {
      this.http
        .get<IPredictiveMetric[]>(`${this.baseUrl}/predictions`, { params: this.buildParams() })
        .pipe(
          map(res => {
            if (JSON.stringify(requestFilters) === JSON.stringify(this._filters())) {
              this._predictions.set({ data: res, filters: requestFilters });
            }
            return res;
          })
        )
        .subscribe({ error: err => console.error('Background refresh predictiveAnalysis failed:', err) });

      return of(cache.data!);
    }

    const params = this.buildParams();
    return this.http.get<IPredictiveMetric[]>(`${this.baseUrl}/predictions`, { params }).pipe(
      map(res => {
        this._predictions.set({ data: res, filters: requestFilters });
        return res;
      })
    );
  }

  /**
   * Builds query params. Both dates are optional — if null, they are omitted
   * so the backend defaults to the full historical period.
   */
  private buildParams(): HttpParams {
    const f = this._filters();
    let params = new HttpParams();

    if (f.startDate) {
      params = params.set('startDate', this.normalizeDate(f.startDate));
    }

    if (f.endDate) {
      params = params.set('endDate', this.normalizeDate(f.endDate));
    }

    if (f.printerId) {
      params = params.set('printerId', f.printerId);
    }

    return params;
  }

  private normalizeDate(date: Date): string {
    // Create a new date object to avoid mutating the original
    const d = new Date(date);
    // Set to midnight local time, then convert to a YYYY-MM-DD string
    // This avoids the timezone shift caused by toISOString()
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }
}
