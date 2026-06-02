import { Component, Inject, Optional, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [NgClass, MatDialogModule, MatButtonModule, TranslateModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  dialogRef = inject(MatDialogRef<ConfirmDialog>);
  public data = inject(MAT_DIALOG_DATA) || {};
}

