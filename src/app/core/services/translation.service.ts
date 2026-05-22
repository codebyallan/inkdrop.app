import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private translate = inject(TranslateService);

  /** Signal that updates whenever the language changes */
  public readonly currentLangSignal = toSignal(
    this.translate.onLangChange.pipe(map(e => e.lang)),
    { initialValue: this.translate.currentLang }
  );

  /** Changes the language at runtime */
  use(lang: 'pt-BR' | 'en-US'): void {
    this.translate.use(lang);
  }

  /** Translates instantly (for use in .ts files) */
  instant(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }

  get currentLang(): string {
    return this.translate.currentLang;
  }
}
