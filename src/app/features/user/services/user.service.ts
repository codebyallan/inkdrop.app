import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IUser, IUserCreateRequest, IUserUpdateRequest, UserRoleLabel, INVERSE_ROLE_MAP } from '../../../types/user.type';
import { tap, catchError } from 'rxjs/operators';
import { CacheEventService } from '../../../core/services/cache-event.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private cacheEvent = inject(CacheEventService);
  private API_URL = `${environment.BASE_URL}/user`;

  private _users = signal<IUser[]>([]);
  private _loaded = signal(false);
  public readonly users = this._users.asReadonly();
  public readonly isLoaded = this._loaded.asReadonly();

  constructor() {
    this.cacheEvent.events$.subscribe(entity => {
      if (entity === 'user') {
        this.getUsers(true).subscribe({ error: err => console.error('Background refresh users failed:', err) });
      }
    });
  }

  getUsers(forceRefresh = false): Observable<IUser[]> {
    const hasCache = this._loaded();

    if (!forceRefresh && hasCache) {
      // Return cache immediately and refresh in background (Stale-While-Revalidate)
      this.http.get<IUser[]>(this.API_URL).pipe(
        tap(data => {
          this._users.set(data);
          this._loaded.set(true);
        })
      ).subscribe({ error: err => console.error('Background refresh users failed:', err) });

      return of(this._users());
    }

    return this.http.get<IUser[]>(this.API_URL).pipe(
      tap(data => {
        this._users.set(data);
        this._loaded.set(true);
      })
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
      tap(created => {
        this._users.update(prev => [...prev, created]);
        this.cacheEvent.broadcast('user');
      }),
      catchError(err => {
        if (err.status === 403) {
          return throwError(() => new Error('PERMISSION_DENIED'));
        }
        return throwError(() => err);
      })
    );
  }

  updateUser(id: string, payload: { username: string; email: string; role: UserRoleLabel }): Observable<IUser> {
    const request: IUserUpdateRequest = {
      ...payload,
      role: INVERSE_ROLE_MAP[payload.role] ?? 1,
    };
    return this.http.put<IUser>(`${this.API_URL}/${id}`, request).pipe(
      tap(updated => {
        this._users.update(prev => 
          prev.map(u => u.id === updated.id ? updated : u)
        );
        this.cacheEvent.broadcast('user');
      }),
      catchError(err => {
        if (err.status === 403) {
          return throwError(() => new Error('PERMISSION_DENIED'));
        }
        return throwError(() => err);
      })
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        this._users.update(prev => prev.filter(u => u.id !== id));
        this.cacheEvent.broadcast('user');
      }),
      catchError(err => {
        if (err.status === 403) {
          return throwError(() => new Error('PERMISSION_DENIED'));
        }
        return throwError(() => err);
      })
    );
  }

  activateUser(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/activate`, {}).pipe(
      tap(() => {
        this._users.update(prev => 
          prev.map(u => u.id === id ? { ...u, isActive: true } : u)
        );
        this.cacheEvent.broadcast('user');
      }),
      catchError(err => {
        if (err.status === 403) {
          return throwError(() => new Error('PERMISSION_DENIED'));
        }
        return throwError(() => err);
      })
    );
  }

  deactivateUser(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/deactivate`, {}).pipe(
      tap(() => {
        this._users.update(prev => 
          prev.map(u => u.id === id ? { ...u, isActive: false } : u)
        );
        this.cacheEvent.broadcast('user');
      }),
      catchError(err => {
        if (err.status === 403) {
          return throwError(() => new Error('PERMISSION_DENIED'));
        }
        return throwError(() => err);
      })
    );
  }
}
