import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { LoginRequest } from '../../../types/login-request.type';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatCardModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  /** Loading state for the login process */
  isLoading = signal(false);

  /** Reactive form for user credentials */
  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  /**
   * Handles the login submission.
   * Orchestrates CSRF token acquisition and authentication request.
   */
  async onSubmit(): Promise<void> {
    if (this.isLoading() || this.loginForm.invalid) return;

    this.isLoading.set(true);

    try {
      // Step 1: Request CSRF token to set the XSRF-TOKEN cookie
      await lastValueFrom(this.authService.getCsrfToken());

      // Step 2: Execute authentication request
      const request: LoginRequest = this.loginForm.value;
      await lastValueFrom(this.authService.login(request));

      this.snackBar.open(
        this.translationService.instant('shared.alerts.logged_in'), 
        this.translationService.instant('shared.actions.close'), 
        { duration: 3000 }
      );
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.snackBar.open(
        this.translationService.instant('login.alerts.failed'), 
        this.translationService.instant('shared.actions.close'), 
        { 
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
