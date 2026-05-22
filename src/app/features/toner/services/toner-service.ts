import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IToner } from '../types';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TonersService {
  private http = inject(HttpClient);
  private API_URL = `${environment.BASE_URL}/toner`;

  private _toners = signal<IToner[]>([]);
  private _lowToners = signal<IToner[]>([]);
  public readonly toners = this._toners.asReadonly();
  public readonly lowToners = this._lowToners.asReadonly();

  getToners(): Observable<IToner[]> {
    if (this._toners().length > 0) {
      return of(this._toners());
    }
    return this.http.get<IToner[]>(this.API_URL).pipe(
      tap(data => this._toners.set(data))
    );
  }

  getLowStock(threshold = 3): Observable<IToner[]> {
    if (this._lowToners().length > 0) {
      return of(this._lowToners());
    }
    return this.http.get<IToner[]>(`${this.API_URL}/low`, {
      params: { threshold: threshold.toString() },
    }).pipe(
      tap(data => this._lowToners.set(data))
    );
  }

  createToner(payload: Partial<IToner>): Observable<IToner> {
    return this.http.post<IToner>(this.API_URL, payload).pipe(
      tap(created => {
        this._toners.update(prev => [...prev, created]);
        this._lowToners.set([]);
      })
    );
  }
  updateToner(id: string, payload: Partial<IToner>): Observable<IToner> {
    return this.http.put<IToner>(`${this.API_URL}/${id}`, payload).pipe(
      tap(updated => {
        this._toners.update(prev => 
          prev.map(t => t.id === updated.id ? updated : t)
        );
        this._lowToners.set([]);
      })
    );
  }
  deleteToner(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        this._toners.update(prev => prev.filter(t => t.id !== id));
        this._lowToners.update(prev => prev.filter(t => t.id !== id));
      })
    );
  }
}

