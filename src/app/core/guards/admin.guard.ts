import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * UX-only guard.
 * This guard provides a smooth transition for authorized users by relying on the local cache.
 * Real authorization must be enforced on the backend for every sensitive request.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.isAdmin()) return true;
  return router.parseUrl('/dashboard');
};
