import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ILocation } from '../types';
import { environment } from '../../../../environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class LocationsService {
  private http = inject(HttpClient);
  private API_URL = `${environment.BASE_URL}/location`;
  
  private _locations = signal<ILocation[]>([]);
  public readonly locations = this._locations.asReadonly();

  getLocations(): Observable<ILocation[]> {
    if (this._locations().length > 0) {
      return of(this._locations());
    }
    return this.http.get<ILocation[]>(this.API_URL).pipe(
      tap(data => this._locations.set(data))
    );
  }
  createLocation(payload: Partial<ILocation>): Observable<ILocation> {
    return this.http.post<ILocation>(this.API_URL, payload).pipe(
      tap(created => this._locations.update(prev => [...prev, created]))
    );
  }
  updateLocation(id: string, payload: Partial<ILocation>): Observable<ILocation> {
    return this.http.put<ILocation>(`${this.API_URL}/${id}`, payload).pipe(
      tap(updated => this._locations.update(prev => 
        prev.map(l => l.id === updated.id ? updated : l)
      ))
    );
  }
  deleteLocation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this._locations.update(prev => prev.filter(l => l.id !== id)))
    );
  }
}
