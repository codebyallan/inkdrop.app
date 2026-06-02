import { Component, Inject, OnInit, Optional, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ValidationMessageComponent } from '../../../../shared/components/validation-message/validation-message.component';
import { TranslateModule } from '@ngx-translate/core';
import { ILocation } from '../../../../types/location.type';

@Component({
  selector: 'app-location-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule, ValidationMessageComponent, TranslateModule],
  templateUrl: './location-form.component.html',
  styleUrl: './location-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationForm implements OnInit {
  private dialogRef = inject(MatDialogRef<LocationForm>);
  public data = inject(MAT_DIALOG_DATA) || { mode: 'create', initial: null };
  
  // Define a type for the initial data to avoid 'any'
  private initialData = this.data.initial as Partial<ILocation> | null;

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('')
  });

  ngOnInit() {
    if (this.initialData) {
      this.form.patchValue(this.initialData);
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
