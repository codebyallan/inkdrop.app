import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef, OnInit } from '@angular/core';
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
import { ChangePasswordPayload, ApiKeyResponse, ApiKeyRequest } from './types';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout';
import { ValidationMessageComponent } from '../../shared/components/validation-message/validation-message';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { UiTableComponent, ColumnDef } from '../../shared/components/ui-table/ui-table';
import { ApiKeyEditDialogComponent } from './components/api-key-edit-dialog/api-key-edit-dialog.component';

function passwordsMatchValidator(g: AbstractControl): ValidationErrors | null {
  const newPassword = g.get('newPassword');
  const confirmPassword = g.get('confirmPassword');

  if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, passwordsMismatch: true });
    return { passwordsMismatch: true };
  }
  
  if (confirmPassword && confirmPassword.hasError('passwordsMismatch')) {
    const errors = { ...confirmPassword.errors };
    delete errors['passwordsMismatch'];
    confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
  }

  return null;
}

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value || '';
  const errors: any = {};

  if (!/[A-Z]/.test(value)) errors.missingUppercase = true;
  if (!/[a-z]/.test(value)) errors.missingLowercase = true;
  if (!/\d/.test(value)) errors.missingNumber = true;
  if (!/[@$!%*?&]/.test(value)) errors.missingSpecial = true;

  return Object.keys(errors).length ? errors : null;
}

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
    ValidationMessageComponent,
    UiTableComponent
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  protected authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private translationService = inject(TranslationService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  protected isChangingPassword = signal(false);
  protected isLoggingOut = signal(false);

  // API Key signals
  protected apiKeys = signal<ApiKeyResponse[]>([]);
  protected isLoadingApiKeys = signal(false);
  protected isCreatingApiKey = signal(false);

  protected passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [
      Validators.required, 
      Validators.minLength(6), 
      passwordStrengthValidator
    ]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: passwordsMatchValidator });

  protected apiKeyForm = this.fb.group({
    name: ['', [Validators.required]],
  });

  protected apiKeyColumns: ColumnDef<ApiKeyResponse>[] = [
    { id: 'name', header: 'settings.api_keys.columns.name', field: 'name', type: 'text' },
    { id: 'createdAt', header: 'settings.api_keys.columns.created_at', field: 'createdAt', type: 'date' },
    { id: 'lastUsedAt', header: 'settings.api_keys.columns.last_used_at', field: 'lastUsedAt', type: 'date' },
    { id: 'actions', type: 'actions' },
  ];

  ngOnInit() {
    if (this.authService.isAdmin()) {
      this.loadApiKeys();
    }
  }

  loadApiKeys() {
    this.isLoadingApiKeys.set(true);
    this.settingsService.getApiKeys().subscribe({
      next: (keys) => this.apiKeys.set(keys),
      error: () => this.snackBar.open(this.translationService.instant('shared.alerts.internal_error'), 'OK', { duration: 5000 }),
      complete: () => this.isLoadingApiKeys.set(false),
    });
  }

  onCreateApiKey() {
    if (this.apiKeyForm.invalid || this.isCreatingApiKey()) return;

    this.isCreatingApiKey.set(true);
    const payload: ApiKeyRequest = {
      name: (this.apiKeyForm.getRawValue().name || '').trim(),
    };

    this.settingsService.createApiKey(payload).subscribe({
      next: (key) => {
        this.snackBar.open(this.translationService.instant('settings.api_keys.created_success'), 'OK', { duration: 5000 });
        this.apiKeyForm.reset();
        this.loadApiKeys();
        
        // Show the key to the user - since it's only returned once
        this.dialog.open(ConfirmDialog, {
          data: {
            title: this.translationService.instant('settings.api_keys.key_generated_title'),
            message: `${this.translationService.instant('settings.api_keys.key_generated_msg')}: ${key}`,
            confirmLabel: this.translationService.instant('shared.actions.confirm'),
            destructive: false,
          },
        });
      },
      error: () => {
        this.snackBar.open(this.translationService.instant('shared.alerts.internal_error'), 'OK', { duration: 5000 });
        this.isCreatingApiKey.set(false);
      },
      complete: () => this.isCreatingApiKey.set(false),
    });
  }

  async onRevokeApiKey(row: ApiKeyResponse) {
    const confirmed = await lastValueFrom(this.dialog.open(ConfirmDialog, {
      data: {
        title: this.translationService.instant('settings.api_keys.revoke_title'),
        message: this.translationService.instant('settings.api_keys.revoke_message'),
        confirmLabel: this.translationService.instant('shared.actions.confirm'),
        cancelLabel: this.translationService.instant('shared.actions.cancel'),
        destructive: true,
      },
    }).afterClosed());

    if (!confirmed) return;

    this.settingsService.revokeApiKey(row.id).subscribe({
      next: () => {
        this.snackBar.open(this.translationService.instant('settings.api_keys.revoked_success'), 'OK', { duration: 5000 });
        this.loadApiKeys();
      },
      error: () => this.snackBar.open(this.translationService.instant('shared.alerts.internal_error'), 'OK', { duration: 5000 }),
    });
  }

  async onEditApiKey(row: ApiKeyResponse) {
    const result = await lastValueFrom(this.dialog.open(ApiKeyEditDialogComponent, {
      data: { id: row.id, currentName: row.name }
    }).afterClosed());

    if (!result) return;

    this.settingsService.updateApiKey(row.id, { name: result.trim() }).subscribe({
      next: () => {
        this.snackBar.open(this.translationService.instant('settings.api_keys.updated_success'), 'OK', { duration: 5000 });
        this.loadApiKeys();
      },
      error: () => this.snackBar.open(this.translationService.instant('shared.alerts.internal_error'), 'OK', { duration: 5000 }),
    });
  }

  onApiKeyAction(event: { type: string; row: ApiKeyResponse }) {
    if (event.type === 'revoke' || event.type === 'delete') {
      this.onRevokeApiKey(event.row);
    } else if (event.type === 'edit') {
      this.onEditApiKey(event.row);
    }
  }

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
    const confirmed = await lastValueFrom(this.dialog.open(ConfirmDialog, {
      data: {
        title: this.translationService.instant('settings.session.logout_title'),
        message: this.translationService.instant('settings.session.logout_message'),
        confirmLabel: this.translationService.instant('shared.actions.confirm'),
        cancelLabel: this.translationService.instant('shared.actions.cancel'),
        destructive: true,
      },
    }).afterClosed());

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
