import { Component, Inject, OnInit, Optional, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { ValidationMessageComponent } from '../../../../shared/components/validation-message/validation-message';
import { LocationsService } from '../../../location/services/location-service';
import { ILocation } from '../../../location/types';

type DialogData = { locations: Array<{ id: string; name: string }>, mode?: 'create' | 'edit', initial?: any };

@Component({
  selector: 'app-printer-form',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule, MatSelectModule, ValidationMessageComponent],
  templateUrl: './printer-form.html',
  styleUrl: './printer-form.scss',
})
export class PrinterForm implements OnInit {
  private dialogRef = inject(MatDialogRef<PrinterForm>);
  private locationsService = inject(LocationsService);
  public data: DialogData = { locations: [] };
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) data: DialogData | null) {
    if (data) this.data = data;
  }

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    model: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    manufacturer: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    ipAddress: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^(\d{1,3}\.){3}\d{1,3}$/)] }),
    locationId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit() {
    if (this.data?.initial) {
      this.form.patchValue(this.data.initial);
    }
    if (!this.data?.locations || this.data.locations.length === 0) {
      this.locationsService.getLocations().subscribe({
        next: (locs: ILocation[]) => {
          this.data.locations = locs.map(l => ({ id: l.id, name: l.name }));
        }
      });
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

