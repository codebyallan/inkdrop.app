import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChangePasswordPayload } from './types';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.BASE_URL}/user`;

  changePassword(payload: ChangePasswordPayload): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/me/password`, payload);
  }
}
