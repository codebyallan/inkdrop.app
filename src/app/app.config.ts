import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, inject, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { lastValueFrom, Observable } from 'rxjs';

import { routes } from './app.routes';
import { xsrfInterceptor } from './core/interceptors/xsrf.interceptor';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { authErrorInterceptor } from './core/interceptors/auth-error.interceptor';
import { AuthService } from './core/services/auth.service';
import { environment } from '../environments/environment';

export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}
  getTranslation(lang: string): Observable<any> {
    return this.http.get(`./assets/i18n/${lang}.json`);
  }
}

export function createTranslateLoader(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor, xsrfInterceptor, authErrorInterceptor])),
    importProvidersFrom(
      TranslateModule.forRoot({
        fallbackLang: 'en-US',
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
      })
    ),
    provideAppInitializer(async () => {
      if (environment.production && !environment.BASE_URL) {
        throw new Error('CRITICAL: BASE_URL is not defined in production environment. Please check your CI/CD environment variables.');
      }

      const translate = inject(TranslateService);
      const auth = inject(AuthService);

      const browserLang = navigator.language || 'en-US';
      const lang = browserLang.startsWith('pt') ? 'pt-BR' : 'en-US';

      translate.addLangs(['pt-BR', 'en-US']);
      translate.setDefaultLang('en-US');
      await lastValueFrom(translate.use(lang));

      await auth.checkSession();
    })
  ]
};
