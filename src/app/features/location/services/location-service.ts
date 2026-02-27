import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ILocation } from '../types';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LocationsService {
  private http = inject(HttpClient);
  private API_URL = `${environment.BASE_URL}/location`;
  getLocations(): Observable<ILocation[]> {
    return this.http.get<ILocation[]>(this.API_URL);
  }
  createLocation(payload: Partial<ILocation>): Observable<ILocation> {
    return this.http.post<ILocation>(this.API_URL, payload);
  }
  updateLocation(id: string, payload: Partial<ILocation>): Observable<ILocation> {
    return this.http.put<ILocation>(`${this.API_URL}/${id}`, payload);
  }
  deleteLocation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
