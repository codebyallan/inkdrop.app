import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout';
import { UiTableComponent } from '../../shared/components/ui-table/ui-table';
import { PrintersService } from './services/printer-service';
import { IPrinter } from './types';
import { LocationsService } from '../location/services/location-service';
import { ILocation } from '../location/types';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PrinterForm } from './components/printer-form/printer-form';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-printer',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, PageLayoutComponent, UiTableComponent, MatDialogModule],
  templateUrl: './printer.html',
  styleUrl: './printer.scss',
})
export class Printer implements OnInit {
  private printersService = inject(PrintersService);
  private _snackBar = inject(MatSnackBar);
  private locationsService = inject(LocationsService);
  private dialog = inject(MatDialog);

  printers = signal<IPrinter[]>([]);
  private locationsMap = new Map<string, string>();
  columnsConfig = [
    { id: 'name', header: 'Name', field: 'name', type: 'text' as const },
    { id: 'model', header: 'Model', field: 'model', type: 'text' as const },
    { id: 'manufacturer', header: 'Manufacturer', field: 'manufacturer', type: 'text' as const },
    { id: 'ipAddress', header: 'IP Address', field: 'ipAddress', type: 'text' as const },
    { id: 'locationName', header: 'Location', field: 'locationName', type: 'text' as const },
    { id: 'createdAt', header: 'Created At', field: 'createdAt', type: 'date' as const, dateFormat: 'dd/MM/yyyy' },
    { id: 'actions', header: '', type: 'actions' as const }
  ];

  ngOnInit() {
    this.locationsService.getLocations().subscribe({
      next: (locs: ILocation[]) => {
        this.locationsMap = new Map(locs.map(l => [l.id, l.name]));
        this.applyLocationNames();
      },
      error: () => this.showAlert('Error fetching locations', 'Close')
    });
    this.printersService.getPrinters().subscribe({
      next: (data) => {
        this.printers.set(data);
        this.applyLocationNames();
      },
      error: () => this.showAlert('Error fetching printers', 'Close'),
    });
  }

  onTableAction(evt: { type: string; row: IPrinter }) {
    if (evt.type === 'delete') {
      this.deletePrinter(evt.row.id);
    } else if (evt.type === 'edit') {
      this.editPrinter(evt.row);
    }
  }

  editPrinter(row: IPrinter) {
    const locations = Array.from(this.locationsMap.entries()).map(([id, name]) => ({ id, name }));
    const ref = this.dialog.open(PrinterForm, {
      width: '500px',
      data: {
        locations,
        mode: 'edit',
        initial: { name: row.name, model: row.model, manufacturer: row.manufacturer, ipAddress: row.ipAddress, locationId: row.locationId }
      }
    });
    ref.afterClosed().subscribe(values => {
      if (values) {
        const confirmRef = this.dialog.open(ConfirmDialog, { width: '300px', data: { title: 'Confirm', message: 'Save changes?', confirmLabel: 'Save', cancelLabel: 'Cancel' } });
        confirmRef.afterClosed().subscribe(confirmed => {
          if (confirmed) {
            this.printersService.updatePrinter(row.id, values).subscribe({
              next: () => {
                this.printersService.getPrinters().subscribe({
                  next: (data) => {
                    this.printers.set(data);
                    this.applyLocationNames();
                    this.showAlert('Printer updated successfully', 'Close');
                  },
                  error: () => this.showAlert('Error refreshing printers list', 'Close')
                });
              },
              error: () => this.showAlert('Error updating printer', 'Close')
            });
          }
        });
      }
    });
  }
  deletePrinter(id: string) {
    const ref = this.dialog.open(ConfirmDialog, { width: '300px' });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.printersService.deletePrinter(id).subscribe({
          next: () => {
            this.printers.update(prev => prev.filter(p => p.id !== id));
            this.showAlert('Printer deleted successfully', 'Close');
          },
          error: () => this.showAlert('Error deleting printer', 'Close')
        });
      }
    });
  }

  openDialog() {
    const ref = this.dialog.open(PrinterForm, { width: '500px', data: { locations: Array.from(this.locationsMap.entries()).map(([id, name]) => ({ id, name })) } });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.printersService.createPrinter(result).subscribe({
          next: () => {
            this.printersService.getPrinters().subscribe({
              next: (data) => {
                this.printers.set(data);
                this.applyLocationNames();
                this.showAlert('Printer created successfully', 'Close');
              },
              error: () => this.showAlert('Error refreshing printers list', 'Close')
            });
          },
          error: (err) => {
            let errorMessage = 'Error creating printer';
            if (err?.status === 400 && err?.error?.errors && err.error.errors[0]?.message) {
              errorMessage = err.error.errors[0].message;
            }
            this.showAlert(errorMessage, 'Close');
          }
        });
      }
    });
  }

  private applyLocationNames() {
    const map = this.locationsMap;
    this.printers.update(list => list.map(p => ({ ...p, locationName: map.get(p.locationId) || p.locationName || '' })));
  }

  showAlert(msg: string, action: string) {
    this._snackBar.open(msg, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}
