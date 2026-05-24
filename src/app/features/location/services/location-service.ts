import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ILocation } from '../types';
import { environment } from '../../../../environments/environment';
import { tap } from 'rxjs/operators';
import { CacheEventService } from '../../../core/services/cache-event.service';

@Injectable({
  providedIn: 'root',
})
export class LocationsService {
  private http = inject(HttpClient);
  private cacheEvent = inject(CacheEventService);
  private API_URL = `${environment.BASE_URL}/location`;
  
  private _locations = signal<ILocation[]>([]);
  public readonly locations = this._locations.asReadonly();

  constructor() {
    this.cacheEvent.events$.subscribe(entity => {
      if (entity === 'location') {
        this.getLocations(true).subscribe();
      }
    });
  }

  getLocations(forceRefresh = false): Observable<ILocation[]> {
    if (!forceRefresh && this._locations().length > 0) {
      return of(this._locations());
    }
    return this.http.get<ILocation[]>(this.API_URL).pipe(
      tap(data => this._locations.set(data))
    );
  }
  createLocation(payload: Partial<ILocation>): Observable<ILocation> {
    return this.http.post<ILocation>(this.API_URL, payload).pipe(
      tap(created => {
        this._locations.update(prev => [...prev, created]);
        this.cacheEvent.broadcast('location');
      })
    );
  }
  updateLocation(id: string, payload: Partial<ILocation>): Observable<ILocation> {
    return this.http.put<ILocation>(`${this.API_URL}/${id}`, payload).pipe(
      tap(updated => {
        this._locations.update(prev => 
          prev.map(l => l.id === updated.id ? updated : l)
        );
        this.cacheEvent.broadcast('location');
      })
    );
  }
  deleteLocation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        this._locations.update(prev => prev.filter(l => l.id !== id));
        this.cacheEvent.broadcast('location');
      })
    );
  }
}
