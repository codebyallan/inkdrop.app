import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IToner } from '../types';

@Injectable({
  providedIn: 'root',
})
export class TonersService {
  private http = inject(HttpClient);
  private API_URL = `${environment.BASE_URL}/toner`;

  getToners(): Observable<IToner[]> {
    return this.http.get<IToner[]>(this.API_URL);
  }

  getLowStock(threshold = 3): Observable<IToner[]> {
    return this.http.get<IToner[]>(`${this.API_URL}/low`, {
      params: { threshold: threshold.toString() },
    });
  }

  createToner(payload: Partial<IToner>): Observable<IToner> {
    return this.http.post<IToner>(this.API_URL, payload);
  }
  deleteToner(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

