import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Fast guard — for internal navigation (non-sensitive routes)
// Trusts the local cache. Session errors will be caught by the 401 interceptor.
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) return true;
  return router.parseUrl('/login');
};

// Verified guard — validates the session with the server before allowing access
// Use in sensitive routes or at the root layout to guarantee the first entry
export const verifiedAuthGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await authService.checkSession();

  if (user) return true;
  return router.parseUrl('/login');
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) return router.parseUrl('/dashboard');
  return true;
};
