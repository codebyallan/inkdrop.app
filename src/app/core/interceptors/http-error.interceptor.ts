import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorNotificationService } from '../services/error-notification.service';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const errorNotifier = inject(ErrorNotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        errorNotifier.showError('shared.alerts.forbidden');
        router.navigate(['/dashboard']);
      } else if (error.status === 0) {
        errorNotifier.showError('shared.alerts.offline');
      } else if (error.status >= 500) {
        errorNotifier.showError('shared.alerts.internal_error');
      }
      
      return throwError(() => error);
    })
  );
};
