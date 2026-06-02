import { Component, Inject, OnInit, Optional, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ValidationMessageComponent } from '../../../../shared/components/validation-message/validation-message.component';
import { TranslateModule } from '@ngx-translate/core';
import { IToner } from '../../../../types/toner.type';

@Component({
  selector: 'app-toner-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule, ValidationMessageComponent, TranslateModule],
  templateUrl: './toner-form.component.html',
  styleUrl: './toner-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TonerForm implements OnInit {
  private dialogRef = inject(MatDialogRef<TonerForm>);
  public data = inject(MAT_DIALOG_DATA) || { mode: 'create', initial: null };
  
  private initialData = this.data.initial as Partial<IToner> | null;

  form = new FormGroup({
    model: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    manufacturer: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    color: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
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

