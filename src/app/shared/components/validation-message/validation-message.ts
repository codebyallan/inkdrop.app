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
  errorMessages = input<Record<string, string>>({});

  message = computed(() => {
    this.t.currentLangSignal();
    const c = this.control();
    if (!c?.errors) return '';
    const errors = c.errors;
    const label = this.label();
    const customMessages = this.errorMessages();

    // 1. Prioridade para mensagens customizadas
    for (const key in errors) {
      if (customMessages[key]) {
        return customMessages[key];
      }
    }

    // 2. Mensagens padrão baseadas no tipo de erro
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

