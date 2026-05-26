import { Component, computed, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-validation-message',
  imports: [MatFormFieldModule],
  templateUrl: './validation-message.html',
  styleUrl: './validation-message.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationMessageComponent {
  private t = inject(TranslationService);

  control = input<AbstractControl | null>(null);
  label = input<string>('Field');

  message = computed(() => {
    this.t.currentLangSignal();
    const c = this.control();
    if (!c?.errors) return '';
    const errors = c.errors;
    const label = this.label();

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

