import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IMovement } from '../types';
import { tap } from 'rxjs/operators';
import { CacheEventService } from '../../../core/services/cache-event.service';

@Injectable({
  providedIn: 'root',
})
export class MovementsService {
  private http = inject(HttpClient);
  private cacheEvent = inject(CacheEventService);
  private API_URL = `${environment.BASE_URL}/movements`;

  private _movements = signal<IMovement[]>([]);
  public readonly movements = this._movements.asReadonly();

  getMovements(forceRefresh = false): Observable<IMovement[]> {
    if (!forceRefresh && this._movements().length > 0) {
      return of(this._movements());
    }
    return this.http.get<IMovement[]>(this.API_URL).pipe(
      tap(data => this._movements.set(data))
    );
  }
  createMovement(payload: Partial<IMovement>): Observable<IMovement> {
    return this.http.post<IMovement>(this.API_URL, payload).pipe(
      tap(created => {
        this._movements.update(prev => [...prev, created]);
        // Broadcast that a movement happened, which should trigger toner refresh
        this.cacheEvent.broadcast('movement');
      })
    );
  }
}

