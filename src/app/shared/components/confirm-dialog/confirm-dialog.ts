import { Component, Inject, Optional, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  dialogRef = inject(MatDialogRef<ConfirmDialog>);
  public data: { title?: string; message?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean } = {};
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) data: { title?: string; message?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean } | null) {
    if (data) this.data = data;
  }
}

