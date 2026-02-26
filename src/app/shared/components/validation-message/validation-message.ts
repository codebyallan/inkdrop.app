import { Component, computed, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-validation-message',
  imports: [MatFormFieldModule],
  templateUrl: './validation-message.html',
  styleUrl: './validation-message.scss',
})
export class ValidationMessageComponent {
  control = input<AbstractControl | null>(null);
  label = input<string>('Field');

  message = computed(() => {
    const c = this.control();
    if (!c || !c.errors) return '';
    const errors = c.errors;
    if (errors['required']) {
      return `${this.label()} is required`;
    }
    if (errors['minlength']) {
      const req = errors['minlength']['requiredLength'];
      return `${this.label()} must be at least ${req} characters`;
    }
    if (errors['maxlength']) {
      const req = errors['maxlength']['requiredLength'];
      return `${this.label()} must be at most ${req} characters`;
    }
    if (errors['email']) {
      return `Invalid ${this.label().toLowerCase()}`;
    }
    // Default: show first key
    const firstKey = Object.keys(errors)[0];
    return `${this.label()} is invalid`;
  });
}

