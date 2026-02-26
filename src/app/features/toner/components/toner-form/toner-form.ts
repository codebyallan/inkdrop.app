import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ValidationMessageComponent } from '../../../../shared/components/validation-message/validation-message';

@Component({
  selector: 'app-toner-form',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule, ValidationMessageComponent],
  templateUrl: './toner-form.html',
  styleUrl: './toner-form.scss',
})
export class TonerForm {
  private dialogRef = inject(MatDialogRef<TonerForm>);

  form = new FormGroup({
    model: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    manufacturer: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    color: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  save() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }

  cancel() {
    this.dialogRef.close();
  }
}

