import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IToner } from '../types';
import { tap } from 'rxjs/operators';
import { CacheEventService } from '../../../core/services/cache-event.service';

@Injectable({
  providedIn: 'root',
})
export class TonersService {
  private http = inject(HttpClient);
  private cacheEvent = inject(CacheEventService);
  private API_URL = `${environment.BASE_URL}/toner`;

  private _toners = signal<IToner[]>([]);
  private _lowToners = signal<IToner[]>([]);
  private _loaded = signal(false);
  private _lowStockLoaded = signal(false);
  public readonly toners = this._toners.asReadonly();
  public readonly lowToners = this._lowToners.asReadonly();
  public readonly isLoaded = this._loaded.asReadonly();
  public readonly isLowStockLoaded = this._lowStockLoaded.asReadonly();

  constructor() {
    // Listen for changes that affect toners
    this.cacheEvent.events$.subscribe(entity => {
      if (entity === 'toner' || entity === 'movement') {
        this.getToners(true).subscribe({ error: err => console.error('Background refresh toners failed:', err) });
        this.getLowStock(3, true).subscribe({ error: err => console.error('Background refresh low stock failed:', err) });
      }
    });
  }

  getToners(forceRefresh = false): Observable<IToner[]> {
    const hasCache = this._loaded();

    if (!forceRefresh && hasCache) {
      // Return cache immediately and refresh in background (Stale-While-Revalidate)
      this.http.get<IToner[]>(this.API_URL).pipe(
        tap(data => {
          this._toners.set(data);
          this._loaded.set(true);
        })
      ).subscribe({ error: err => console.error('Background refresh toners failed:', err) });

      return of(this._toners());
    }

    return this.http.get<IToner[]>(this.API_URL).pipe(
      tap(data => {
        this._toners.set(data);
        this._loaded.set(true);
      })
    );
  }

  getLowStock(threshold = 3, forceRefresh = false): Observable<IToner[]> {
    const hasCache = this._lowStockLoaded();

    if (!forceRefresh && hasCache) {
      // Return cache immediately and refresh in background (Stale-While-Revalidate)
      this.http.get<IToner[]>(`${this.API_URL}/low`, {
        params: { threshold: threshold.toString() },
      }).pipe(
        tap(data => {
          this._lowToners.set(data);
          this._lowStockLoaded.set(true);
        })
      ).subscribe({ error: err => console.error('Background refresh low stock failed:', err) });

      return of(this._lowToners());
    }

    return this.http.get<IToner[]>(`${this.API_URL}/low`, {
      params: { threshold: threshold.toString() },
    }).pipe(
      tap(data => {
        this._lowToners.set(data);
        this._lowStockLoaded.set(true);
      })
    );
  }

  createToner(payload: Partial<IToner>): Observable<IToner> {
    return this.http.post<IToner>(this.API_URL, payload).pipe(
      tap(created => {
        this._toners.update(prev => [...prev, created]);
        this.cacheEvent.broadcast('toner');
      })
    );
  }
  updateToner(id: string, payload: Partial<IToner>): Observable<IToner> {
    return this.http.put<IToner>(`${this.API_URL}/${id}`, payload).pipe(
      tap(updated => {
        this._toners.update(prev => 
          prev.map(t => t.id === updated.id ? updated : t)
        );
        this.cacheEvent.broadcast('toner');
      })
    );
  }
  deleteToner(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        this._toners.update(prev => prev.filter(t => t.id !== id));
        this._lowToners.update(prev => prev.filter(t => t.id !== id));
        this.cacheEvent.broadcast('toner');
      })
    );
  }
}

