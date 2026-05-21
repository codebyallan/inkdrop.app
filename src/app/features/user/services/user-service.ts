import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IUser, IUserCreateRequest, IUserUpdateRequest, UserRoleLabel, INVERSE_ROLE_MAP } from '../types';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private API_URL = `${environment.BASE_URL}/user`;

  getUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(this.API_URL);
  }

  getUserById(id: string): Observable<IUser> {
    return this.http.get<IUser>(`${this.API_URL}/${id}`);
  }

  createUser(payload: { username: string; email: string; password: string; role: UserRoleLabel }): Observable<IUser> {
    const request: IUserCreateRequest = {
      ...payload,
      role: INVERSE_ROLE_MAP[payload.role] ?? 1,
    };
    return this.http.post<IUser>(this.API_URL, request);
  }

  updateUser(id: string, payload: { username: string; email: string; role: UserRoleLabel }): Observable<IUser> {
    const request: IUserUpdateRequest = {
      ...payload,
      role: INVERSE_ROLE_MAP[payload.role] ?? 1,
    };
    return this.http.put<IUser>(`${this.API_URL}/${id}`, request);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  activateUser(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/activate`, {});
  }

  deactivateUser(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/deactivate`, {});
  }
}
