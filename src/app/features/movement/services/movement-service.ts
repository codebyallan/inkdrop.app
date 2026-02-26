import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IMovement } from '../types';

@Injectable({
  providedIn: 'root',
})
export class MovementsService {
  private http = inject(HttpClient);
  private API_URL = `${environment.BASE_URL}/movements`;

  getMovements(): Observable<IMovement[]> {
    return this.http.get<IMovement[]>(this.API_URL);
  }
  createMovement(payload: Partial<IMovement>): Observable<IMovement> {
    return this.http.post<IMovement>(this.API_URL, payload);
  }
}

