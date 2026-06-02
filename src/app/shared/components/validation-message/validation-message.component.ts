import { Component, computed, inject, input, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-validation-message',
  standalone: true,
  imports: [MatFormFieldModule],
  templateUrl: './validation-message.component.html',
  styleUrl: './validation-message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationMessageComponent {
  private t = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);

  control = input<AbstractControl | null>(null);
  label = input<string>('Field');
  errorMessages = input<Record<string, string>>({});

  constructor() {
    effect(() => {
      const c = this.control();
      if (c) {
        c.statusChanges.subscribe(() => {
          this.cdr.markForCheck();
        });
      }
    });
  }

  message = computed(() => {
    this.t.currentLangSignal();
    const c = this.control();
    if (!c?.errors) return '';
    const errors = c.errors;
    const label = this.label();
    const customMessages = this.errorMessages();

    for (const key in errors) {
      if (customMessages[key]) {
        return customMessages[key];
      }
    }

    if (errors['required'])
      return this.t.instant('shared.validation.required', { label });
    if (errors['minlength'])
      return this.t.instant('shared.validation.min_length', { label, min: errors['minlength'].requiredLength });
    if (errors['maxlength'])
      return this.t.instant('shared.validation.max_length', { label, max: errors['maxlength'].requiredLength });
    if (errors['email'])
      return this.t.instant('shared.validation.email', { label });
    
    return this.t.instant('shared.validation.invalid', { label });
  });
}

