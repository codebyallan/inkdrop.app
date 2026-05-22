import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IUser, IUserCreateRequest, IUserUpdateRequest, UserRoleLabel, INVERSE_ROLE_MAP } from '../types';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private API_URL = `${environment.BASE_URL}/user`;

  private _users = signal<IUser[]>([]);
  public readonly users = this._users.asReadonly();

  getUsers(): Observable<IUser[]> {
    if (this._users().length > 0) {
      return of(this._users());
    }
    return this.http.get<IUser[]>(this.API_URL).pipe(
      tap(data => this._users.set(data))
    );
  }

  getUserById(id: string): Observable<IUser> {
    const cached = this._users().find(u => u.id === id);
    if (cached) return of(cached);
    return this.http.get<IUser>(`${this.API_URL}/${id}`);
  }

  createUser(payload: { username: string; email: string; password: string; role: UserRoleLabel }): Observable<IUser> {
    const request: IUserCreateRequest = {
      ...payload,
      role: INVERSE_ROLE_MAP[payload.role] ?? 1,
    };
    return this.http.post<IUser>(this.API_URL, request).pipe(
      tap(created => this._users.update(prev => [...prev, created]))
    );
  }

  updateUser(id: string, payload: { username: string; email: string; role: UserRoleLabel }): Observable<IUser> {
    const request: IUserUpdateRequest = {
      ...payload,
      role: INVERSE_ROLE_MAP[payload.role] ?? 1,
    };
    return this.http.put<IUser>(`${this.API_URL}/${id}`, request).pipe(
      tap(updated => this._users.update(prev => 
        prev.map(u => u.id === updated.id ? updated : u)
      ))
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this._users.update(prev => prev.filter(u => u.id !== id)))
    );
  }

  activateUser(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/activate`, {}).pipe(
      tap(() => this._users.update(prev => 
        prev.map(u => u.id === id ? { ...u, isActive: true } : u)
      ))
    );
  }

  deactivateUser(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/deactivate`, {}).pipe(
      tap(() => this._users.update(prev => 
        prev.map(u => u.id === id ? { ...u, isActive: false } : u)
      ))
    );
  }
}
