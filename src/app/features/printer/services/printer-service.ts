import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IPrinter } from '../types';

@Injectable({
  providedIn: 'root',
})
export class PrintersService {
  private http = inject(HttpClient);
  private API_URL = `${environment.BASE_URL}/printer`;

  getPrinters(): Observable<IPrinter[]> {
    return this.http.get<IPrinter[]>(this.API_URL);
    }
  createPrinter(payload: Partial<IPrinter>): Observable<IPrinter> {
    return this.http.post<IPrinter>(this.API_URL, payload);
  }
  deletePrinter(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

