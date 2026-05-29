import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

export interface ApiKeyEditDialogData {
  id: string;
  currentName: string;
}

@Component({
  selector: 'app-api-key-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ 'settings.api_keys.edit_title' | translate }}</h2>
    <div class="p-6">
      <form [formGroup]="editForm" class="flex flex-col gap-4 mt-4">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>{{ 'settings.api_keys.name_placeholder' | translate }}</mat-label>
          <input matInput formControlName="name">
        </mat-form-field>
      </form>
    </div>
    <mat-dialog-actions align="end" class="p-6 pt-0">
      <button mat-button (click)="onCancel()">{{ 'shared.actions.cancel' | translate }}</button>
      <button mat-flat-button color="primary" 
              [disabled]="editForm.invalid" 
              (click)="onSave()">
        {{ 'shared.actions.save' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    form { min-width: 300px; }
  `]
})
export class ApiKeyEditDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ApiKeyEditDialogComponent>);
  private data = inject(MAT_DIALOG_DATA) as ApiKeyEditDialogData;

  protected editForm = this.fb.group({
    name: [this.data.currentName, [Validators.required]],
  });

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.editForm.valid) {
      this.dialogRef.close(this.editForm.value.name);
    }
  }
}
