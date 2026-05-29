import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChangePasswordPayload, ApiKeyRequest, ApiKeyResponse, ApiKeyUpdateRequest } from './types';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly USER_API_URL = `${environment.BASE_URL}/user`;
  private readonly API_KEY_URL = `${environment.BASE_URL}/ApiKey`;

  changePassword(payload: ChangePasswordPayload): Observable<void> {
    return this.http.patch<void>(`${this.USER_API_URL}/me/password`, payload);
  }

  getApiKeys(): Observable<ApiKeyResponse[]> {
    return this.http.get<ApiKeyResponse[]>(this.API_KEY_URL);
  }

  createApiKey(request: ApiKeyRequest): Observable<string> {
    return this.http.post(this.API_KEY_URL, request, { responseType: 'text' });
  }

  updateApiKey(id: string, request: ApiKeyUpdateRequest): Observable<void> {
    return this.http.put<void>(`${this.API_KEY_URL}/${id}`, request);
  }

  revokeApiKey(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_KEY_URL}/${id}`);
  }
}
