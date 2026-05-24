import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IPrinter } from '../types';
import { tap } from 'rxjs/operators';
import { CacheEventService } from '../../../core/services/cache-event.service';

@Injectable({
  providedIn: 'root',
})
export class PrintersService {
  private http = inject(HttpClient);
  private cacheEvent = inject(CacheEventService);
  private API_URL = `${environment.BASE_URL}/printer`;

  private _printers = signal<IPrinter[]>([]);
  public readonly printers = this._printers.asReadonly();

  constructor() {
    this.cacheEvent.events$.subscribe(entity => {
      if (entity === 'printer' || entity === 'location') {
        this.getPrinters(true).subscribe();
      }
    });
  }

  getPrinters(forceRefresh = false): Observable<IPrinter[]> {
    if (!forceRefresh && this._printers().length > 0) {
      return of(this._printers());
    }
    return this.http.get<IPrinter[]>(this.API_URL).pipe(
      tap(data => this._printers.set(data))
    );
  }
  createPrinter(payload: Partial<IPrinter>): Observable<IPrinter> {
    return this.http.post<IPrinter>(this.API_URL, payload).pipe(
      tap(created => {
        this._printers.update(prev => [...prev, created]);
        this.cacheEvent.broadcast('printer');
      })
    );
  }
  updatePrinter(id: string, payload: Partial<IPrinter>): Observable<IPrinter> {
    return this.http.put<IPrinter>(`${this.API_URL}/${id}`, payload).pipe(
      tap(updated => {
        this._printers.update(prev => 
          prev.map(p => p.id === updated.id ? updated : p)
        );
        this.cacheEvent.broadcast('printer');
      })
    );
  }
  deletePrinter(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        this._printers.update(prev => prev.filter(p => p.id !== id));
        this.cacheEvent.broadcast('printer');
      })
    );
  }

  applyLocationNames(locationsMap: Map<string, string>) {
    this._printers.update(list => 
      list.map(p => ({ ...p, locationName: locationsMap.get(p.locationId) || p.locationName || '' }))
    );
  }
}

