import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { LocationsService } from './services/location-service';
import { ILocation } from './types';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { LocationForm } from './components/location-form/location-form';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout';
import { UiTableComponent } from '../../shared/components/ui-table/ui-table';

@Component({
  selector: 'app-location',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatSnackBarModule, PageLayoutComponent, UiTableComponent],
  templateUrl: './location.html',
  styleUrl: './location.scss',
})
export class Location implements OnInit {
  private locationsService = inject(LocationsService);
  private dialog = inject(MatDialog);
  private _snackBar = inject(MatSnackBar);

  locations = signal<ILocation[]>([]);
  loading = signal<boolean>(true);
  columnsConfig = [
    { id: 'name', header: 'Name', field: 'name', type: 'text' as const },
    { id: 'description', header: 'Description', field: 'description', type: 'text' as const },
    { id: 'createdAt', header: 'Created At', field: 'createdAt', type: 'date' as const, dateFormat: 'dd/MM/yyyy' },
    { id: 'actions', header: '', type: 'actions' as const }
  ];

  ngOnInit() {
    this.loading.set(true);
    this.locationsService.getLocations().subscribe({
      next: (data) => {
        this.locations.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.showAlert('Error fetching locations', 'Close');
      }
    });
  }
  openDialog() {
    const ref = this.dialog.open(LocationForm, { width: '400px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.locationsService.createLocation(result).subscribe({
          next: () => {
            this.locationsService.getLocations().subscribe({
              next: (data) => {
                this.locations.set(data);
                this.showAlert('Location created successfully', 'Close');
              }
            });
          },
          error: (err) => {
            let errorMessage = 'Error creating location';
            if (err.status === 400 && err.error?.errors) {
              errorMessage = err.error.errors[0].message;
            }
            this.showAlert(errorMessage, 'Close');
          }
        });
      }
    });
  }

  onTableAction(evt: { type: string; row: ILocation }) {
    if (evt.type === 'delete') {
      this.deleteLocation(evt.row.id);
    } else if (evt.type === 'edit') {
      this.editLocation(evt.row);
    }
  }

  editLocation(row: ILocation) {
    const ref = this.dialog.open(LocationForm, { width: '400px', data: { mode: 'edit', initial: { name: row.name, description: row.description } } });
    ref.afterClosed().subscribe(values => {
      if (values) {
        const confirmRef = this.dialog.open(ConfirmDialog, { width: '300px', data: { title: 'Confirm', message: 'Save changes?', confirmLabel: 'Save', cancelLabel: 'Cancel' } });
        confirmRef.afterClosed().subscribe(confirmed => {
          if (confirmed) {
            this.locationsService.updateLocation(row.id, values).subscribe({
              next: () => {
                this.locationsService.getLocations().subscribe({
                  next: (data) => {
                    this.locations.set(data);
                    this.showAlert('Location updated successfully', 'Close');
                  }
                });
              }
            });
          }
        });
      }
    });
  }
  deleteLocation(id: string) {
    const ref = this.dialog.open(ConfirmDialog, { width: '300px' });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.locationsService.deleteLocation(id).subscribe({
          next: () => {
            this.locations.update(prev => prev.filter(l => l.id !== id));
            this.showAlert('Location deleted successfully', 'Close');
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
