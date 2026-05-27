import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { lastValueFrom, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { SettingsService } from './settings.service';
import { ChangePasswordPayload } from './types';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout';
import { ValidationMessageComponent } from '../../shared/components/validation-message/validation-message';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    TranslateModule,
    PageLayoutComponent,
    ValidationMessageComponent
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private translationService = inject(TranslationService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  protected isChangingPassword = signal(false);
  protected isLoggingOut = signal(false);

  protected passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [
      Validators.required, 
      Validators.minLength(6), 
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
    ]],
  });

  onChangePassword() {
    if (this.passwordForm.invalid || this.isChangingPassword()) {
      return;
    }

    this.isChangingPassword.set(true);
    this.passwordForm.disable();
    
    const rawValues = this.passwordForm.getRawValue();
    const payload: ChangePasswordPayload = {
      currentPassword: (rawValues.currentPassword || '').trim(),
      newPassword: (rawValues.newPassword || '').trim(),
    };

    this.settingsService.changePassword(payload).subscribe({
      next: async () => {
        this.snackBar.open(
          this.translationService.instant('settings.security.changed_success_logout'), 
          'OK', 
          { duration: 5000 }
        );
        
        timer(2000)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(async () => {
            try {
              await lastValueFrom(this.authService.logout());
            } catch (e) {
              console.error('Logout after password change failed', e);
            } finally {
              this.router.navigate(['/login']);
            }
          });
      },
      error: (err) => {
        this.passwordForm.enable();
        const errorKey = err.error?.errors?.[0]?.key;
        const message = this.mapPasswordError(errorKey);
        this.snackBar.open(message, 'OK', { duration: 5000 });
        this.isChangingPassword.set(false);
      },
      complete: () => {
        this.isChangingPassword.set(false);
      },
    });
  }

  private mapPasswordError(key?: string): string {
    switch (key) {
      case 'InvalidCurrentPassword':
        return this.translationService.instant('settings.security.wrong_password');
      case 'NewPasswordSameAsOld':
        return this.translationService.instant('settings.security.same_password');
      default:
        return this.translationService.instant('shared.alerts.internal_error');
    }
  }

  async onLogout() {
    const confirmed = await this.dialog.open(ConfirmDialog, {
      data: {
        title: this.translationService.instant('settings.security.logout_title'),
        message: this.translationService.instant('settings.security.logout_message'),
        confirmLabel: this.translationService.instant('shared.actions.confirm'),
        cancelLabel: this.translationService.instant('shared.actions.cancel'),
        destructive: true,
      },
    }).afterClosed().toPromise();

    if (!confirmed) return;

    this.isLoggingOut.set(true);
    try {
      await lastValueFrom(this.authService.logout());
      this.router.navigate(['/login']);
    } catch {
      this.router.navigate(['/login']);
    } finally {
      this.isLoggingOut.set(false);
    }
  }
}
