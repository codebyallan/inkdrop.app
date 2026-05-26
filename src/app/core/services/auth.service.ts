import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { User } from '../../types/user.type';
import { LoginRequest } from '../../types/login-request.type';
import { AuthResponse } from '../../types/auth-response.type';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.BASE_URL}/auth`;
  private readonly USER_CACHE_KEY = 'inkdrop_user_cache';

  /**
   * Internal state for the current authenticated user.
   * Initialized from localStorage to prevent flickering on page reload.
   */
  private currentUserSignal = signal<User | null>(this.loadUserFromCache());
  
  /**
   * Public read-only signal providing the current user state.
   */
  public readonly currentUser = computed(() => this.currentUserSignal());
  
  /**
   * Derived signal to quickly check if the user is authenticated.
   */
  public readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  /**
   * Derived signal to check if the current user has Admin privileges.
   */
  public readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'Admin');

  constructor(private http: HttpClient) {}

  /**
   * Requests the XSRF token from the API to be set as a cookie.
   * Required for all subsequent mutating requests (POST, PUT, DELETE).
   */
  getCsrfToken(): Observable<void> {
    return this.http.get<void>(`${this.API_URL}/csrf`);
  }

  /**
   * Authenticates the user using credentials.
   * On success, it updates the local session state and cache.
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, request).pipe(
      tap(response => this.setUser(response.user))
    );
  }

  /**
   * Validates the current session cookie with the server.
   * Syncs the localStorage cache with the actual server state.
   */
  async checkSession(): Promise<User | null> {
    try {
      const user = await lastValueFrom(this.http.get<User>(`${this.API_URL}/me`));
      this.setUser(user);
      return user;
    } catch (error) {
      this.clearUser();
      return null;
    }
  }

  /**
   * Terminates the session on the server and clears the local cache.
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/logout`, null).pipe(
      tap(() => this.clearUser()),
      catchError(() => {
        this.clearUser();
        return of(void 0);
      })
    );
  }

  private setUser(user: User): void {
    if (!this.isValidUser(user)) {
      console.error('AuthService: Attempted to set an invalid user object');
      this.clearUser();
      return;
    }
    this.currentUserSignal.set(user);
    localStorage.setItem(this.USER_CACHE_KEY, JSON.stringify(user));
  }

  private clearUser(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem(this.USER_CACHE_KEY);
  }

  public clearUserPublic(): void {
    this.clearUser();
  }

  private loadUserFromCache(): User | null {
    const cached = localStorage.getItem(this.USER_CACHE_KEY);
    if (!cached) return null;
    try {
      const user = JSON.parse(cached);
      if (this.isValidUser(user)) {
        return user;
      }
      console.warn('AuthService: Invalid user cache detected. Clearing cache.');
      localStorage.removeItem(this.USER_CACHE_KEY);
    } catch {
      console.warn('AuthService: Failed to parse user cache. Clearing cache.');
      localStorage.removeItem(this.USER_CACHE_KEY);
    }
    return null;
  }

  private isValidUser(obj: unknown): obj is User {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as any).id === 'string' &&
      typeof (obj as any).username === 'string' &&
      typeof (obj as any).role === 'string'
    );
  }
}
