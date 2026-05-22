import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { xsrfInterceptor } from './core/interceptors/xsrf.interceptor';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { authErrorInterceptor } from './core/interceptors/auth-error.interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor, xsrfInterceptor, authErrorInterceptor])),
    provideAppInitializer(async () => {
      const authService = inject(AuthService);
      await authService.checkSession();
    })
  ]
};
