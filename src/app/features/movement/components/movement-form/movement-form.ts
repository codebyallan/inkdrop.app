import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { ValidationMessageComponent } from '../../../../shared/components/validation-message/validation-message';
import { TonersService } from '../../../toner/services/toner-service';
import { PrintersService } from '../../../printer/services/printer-service';
import { IToner } from '../../../toner/types';
import { IPrinter } from '../../../printer/types';

type DialogData = { toners: Array<{ id: string; label: string }>, printers: Array<{ id: string; name: string }> };

@Component({
  selector: 'app-movement-form',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule, MatSelectModule, ValidationMessageComponent],
  templateUrl: './movement-form.html',
  styleUrl: './movement-form.scss',
})
export class MovementForm implements OnInit {
  private dialogRef = inject(MatDialogRef<MovementForm>);
  private tonersService = inject(TonersService);
  private printersService = inject(PrintersService);
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  form = new FormGroup({
    tonerId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    printerId: new FormControl<string | null>(null),
    quantity: new FormControl<number | null>(null, { validators: [Validators.required] }),
    description: new FormControl<string | null>(null),
    type: new FormControl<'in' | 'out' | ''>('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit() {
    this.form.controls.type.valueChanges.subscribe(t => {
      const ctrl = this.form.controls.printerId;
      if (t === 'out') {
        ctrl.addValidators([Validators.required]);
      } else {
        ctrl.clearValidators();
        ctrl.setValue(null);
      }
      ctrl.updateValueAndValidity({ emitEvent: false });
    });

    if (!this.data?.toners || this.data.toners.length === 0) {
      this.tonersService.getToners().subscribe({
        next: (toners: IToner[]) => {
          this.data.toners = toners.map(t => ({ id: t.id, label: `${t.model} - ${t.color}` }));
        }
      });
    }
    if (!this.data?.printers || this.data.printers.length === 0) {
      this.printersService.getPrinters().subscribe({
        next: (printers: IPrinter[]) => {
          this.data.printers = printers.map(p => ({ id: p.id, name: p.name }));
        }
      });
    }
  }

  save() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const payload = {
      tonerId: raw.tonerId,
      printerId: raw.printerId || null,
      quantity: raw.quantity,
      description: raw.description,
      type: raw.type,
    };
    this.dialogRef.close(payload);
  }

  cancel() {
    this.dialogRef.close();
  }
}

