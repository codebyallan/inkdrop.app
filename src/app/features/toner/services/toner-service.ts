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
  public readonly toners = this._toners.asReadonly();

  getToners(): Observable<IToner[]> {
    if (this._toners().length > 0) {
      return of(this._toners());
    }
    return this.http.get<IToner[]>(this.API_URL).pipe(
      tap(data => this._toners.set(data))
    );
  }

  getLowStock(threshold = 3): Observable<IToner[]> {
    // Low stock filter is done based on the current cached list if available
    if (this._toners().length > 0) {
      const filtered = this._toners().filter(t => t.quantity <= threshold);
      return of(filtered);
    }
    return this.http.get<IToner[]>(`${this.API_URL}/low`, {
      params: { threshold: threshold.toString() },
    }).pipe(
      tap(data => this._toners.set(data)) // Note: this might set the signal to only low stock if called first
    );
  }

  createToner(payload: Partial<IToner>): Observable<IToner> {
    return this.http.post<IToner>(this.API_URL, payload).pipe(
      tap(created => this._toners.update(prev => [...prev, created]))
    );
  }
  updateToner(id: string, payload: Partial<IToner>): Observable<IToner> {
    return this.http.put<IToner>(`${this.API_URL}/${id}`, payload).pipe(
      tap(updated => this._toners.update(prev => 
        prev.map(t => t.id === updated.id ? updated : t)
      ))
    );
  }
  deleteToner(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this._toners.update(prev => prev.filter(t => t.id !== id)))
    );
  }
}

