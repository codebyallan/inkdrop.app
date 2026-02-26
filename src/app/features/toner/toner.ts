import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout';
import { UiTableComponent } from '../../shared/components/ui-table/ui-table';
import { TonersService } from './services/toner-service';
import { IToner } from './types';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialog } from '../location/components/confirm-dialog/confirm-dialog';
import { TonerForm } from './components/toner-form/toner-form';

@Component({
  selector: 'app-toner',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, PageLayoutComponent, UiTableComponent, MatDialogModule],
  templateUrl: './toner.html',
  styleUrl: './toner.scss',
})
export class Toner implements OnInit {
  private tonersService = inject(TonersService);
  private _snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  toners = signal<IToner[]>([]);
  columnsConfig = [
    { id: 'model', header: 'Model', field: 'model', type: 'text' as const },
    { id: 'manufacturer', header: 'Manufacturer', field: 'manufacturer', type: 'text' as const },
    { id: 'color', header: 'Color', field: 'color', type: 'text' as const },
    { id: 'quantity', header: 'Quantity', field: 'quantity', type: 'text' as const },
    { id: 'createdAt', header: 'Created At', field: 'createdAt', type: 'date' as const, dateFormat: 'dd/MM/yyyy' },
    { id: 'actions', header: '', type: 'actions' as const }
  ];

  ngOnInit() {
    this.tonersService.getToners().subscribe({
      next: (data) => this.toners.set(data),
      error: () => this.showAlert('Error fetching toners', 'Close'),
    });
  }

  onTableAction(evt: { type: string; row: IToner }) {
    if (evt.type === 'delete') {
      this.deleteToner(evt.row.id);
    }
  }

  deleteToner(id: string) {
    const ref = this.dialog.open(ConfirmDialog, { width: '300px' });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.tonersService.deleteToner(id).subscribe({
          next: () => {
            this.toners.update(prev => prev.filter(t => t.id !== id));
            this.showAlert('Toner deleted successfully', 'Close');
          },
          error: () => this.showAlert('Error deleting toner', 'Close')
        });
      }
    });
  }

  openDialog() {
    const ref = this.dialog.open(TonerForm, { width: '500px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.tonersService.createToner(result).subscribe({
          next: () => {
            this.tonersService.getToners().subscribe({
              next: (data) => {
                this.toners.set(data);
                this.showAlert('Toner created successfully', 'Close');
              },
              error: () => this.showAlert('Error refreshing toners list', 'Close')
            });
          },
          error: (err) => {
            let errorMessage = 'Error creating toner';
            if (err?.status === 400 && err?.error?.errors && err.error.errors[0]?.message) {
              errorMessage = err.error.errors[0].message;
            }
            this.showAlert(errorMessage, 'Close');
          }
        });
      }
    });
  }

  showAlert(msg: string, action: string) {
    this._snackBar.open(msg, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}

