import { Component, Inject, OnInit, Optional, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ValidationMessageComponent } from '../../../../shared/components/validation-message/validation-message';
import { INVERSE_ROLE_MAP } from '../../types';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';
import { computed } from '@angular/core';

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
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm implements OnInit {
  private dialogRef = inject(MatDialogRef<UserForm>);
  private authService = inject(AuthService);
  private t = inject(TranslationService);
  public data: { mode?: 'create' | 'edit'; initial?: any } = {};
  
  protected readonly ROLES = computed(() => {
    this.t.currentLangSignal();
    return [
      { value: 0, label: this.t.instant('users.role_admin') },
      { value: 1, label: this.t.instant('users.role_technician') },
    ];
  });

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) data: { mode?: 'create' | 'edit'; initial?: any } | null) {
    if (data) this.data = data;
  }

  get isEditingSelf() {
    const initial = this.data.initial as any;
    return this.data.mode === 'edit' && initial?.id === this.authService.currentUser()?.id;
  }

  form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true }),
    role: new FormControl<string | null>(null, { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit() {
    if (this.data?.initial) {
      this.form.patchValue(this.data.initial);
    }
  }

  save() {
    if (this.form.invalid) return;
    
    const rawValue = this.form.getRawValue();
    
    // In edit mode, we don't send the password
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
