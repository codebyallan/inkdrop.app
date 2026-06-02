import { Component, Inject, OnInit, Optional, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ValidationMessageComponent } from '../../../../shared/components/validation-message/validation-message.component';
import { INVERSE_ROLE_MAP } from '../../../../types/user.type';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';
import { IUser, UserRole } from '../../../../types/user.type';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    MatButtonModule, 
    MatDialogModule, 
    ValidationMessageComponent,
    TranslateModule
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm implements OnInit {
  private dialogRef = inject(MatDialogRef<UserForm>);
  private authService = inject(AuthService);
  private t = inject(TranslationService);
  public data = inject(MAT_DIALOG_DATA) || { mode: 'create', initial: null };
  
  private initialData = this.data.initial as Partial<IUser> | null;
  
  protected readonly ROLES = computed(() => {
    this.t.currentLangSignal();
    return [
      { value: 0, label: this.t.instant('users.role_admin') },
      { value: 1, label: this.t.instant('users.role_technician') },
    ];
  });

  get isEditingSelf() {
    return this.data.mode === 'edit' && this.initialData?.id === this.authService.currentUser()?.id;
  }

  form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true }),
    role: new FormControl<UserRole | null>(null, { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit() {
    if (this.initialData) {
      this.form.patchValue(this.initialData);
    }
  }

  save() {
    if (this.form.invalid) return;
    
    const rawValue = this.form.getRawValue();
    
    if (this.data.mode === 'edit') {
      const { password, ...dataToSave } = rawValue;
      this.dialogRef.close(dataToSave);
    } else {
      if (!rawValue.password) {
        this.form.controls.password.setErrors({ required: true });
        return;
      }
      this.dialogRef.close(rawValue);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
