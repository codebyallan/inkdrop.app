import { Component, Inject, OnInit, Optional, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ValidationMessageComponent } from '../../../../shared/components/validation-message/validation-message';

@Component({
  selector: 'app-location-form',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule, ValidationMessageComponent],
  templateUrl: './location-form.html',
  styleUrl: './location-form.scss',
})
export class LocationForm implements OnInit {
  private dialogRef = inject(MatDialogRef<LocationForm>);
  public data: { mode?: 'create' | 'edit'; initial?: any } = {};
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) data: { mode?: 'create' | 'edit'; initial?: any } | null) {
    if (data) this.data = data;
  }

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('')
  });

  ngOnInit() {
    if (this.data?.initial) {
      this.form.patchValue(this.data.initial);
    }
  }

  save() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }

  cancel() {
    this.dialogRef.close();
  }
}
