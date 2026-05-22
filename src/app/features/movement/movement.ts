import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout';
import { UiTableComponent } from '../../shared/components/ui-table/ui-table';
import { MovementsService } from './services/movement-service';
import { IMovement } from './types';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MovementForm } from './components/movement-form/movement-form';
import { TonersService } from '../toner/services/toner-service';
import { PrintersService } from '../printer/services/printer-service';
import { IToner } from '../toner/types';
import { IPrinter } from '../printer/types';
import { LocationsService } from '../location/services/location-service';
import { ILocation } from '../location/types';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-movement',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, PageLayoutComponent, UiTableComponent, MatDialogModule],
  templateUrl: './movement.html',
  styleUrl: './movement.scss',
})
export class Movement implements OnInit {
  private movementsService = inject(MovementsService);
  private tonersService = inject(TonersService);
  private printersService = inject(PrintersService);
  private locationsService = inject(LocationsService);
  private _snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  movements = this.movementsService.movements;
  locations = this.locationsService.locations;
  private tonersMap = new Map<string, string>();
  private printersMap = new Map<string, { name: string, locationId: string }>();
  loading = signal<boolean>(true);

  columnsConfig = [
    { id: 'tonerModel', header: 'Toner', field: 'tonerModel', type: 'text' as const },
    { id: 'printerName', header: 'Printer', field: 'printerName', type: 'text' as const },
    { id: 'quantity', header: 'Quantity', field: 'quantity', type: 'text' as const },
    { id: 'type', header: 'Type', field: 'type', type: 'text' as const },
    { id: 'description', header: 'Description', field: 'description', type: 'text' as const },
    { id: 'createdAt', header: 'Created At', field: 'createdAt', type: 'date' as const, dateFormat: 'dd/MM/yyyy' }
  ];

  // Computed signal to handle the dynamic composition of Printer - Location
  movementsWithDetails = computed(() => {
    const list = this.movements();
    const tonersMap = this.tonersMap;
    const printersMap = this.printersMap;
    const locationsMap = new Map(this.locations().map(l => [l.id, l.name]));

    return list.map(m => {
      const printer = m.printerId ? printersMap.get(m.printerId) : null;
      const locationName = printer ? locationsMap.get(printer.locationId) : '';
      const printerDisplay = printer 
        ? `${printer.name} - ${locationName || 'No Location'}` 
        : (m.printerName || '');

      return {
        ...m,
        tonerModel: m.tonerId ? (tonersMap.get(m.tonerId) || m.tonerModel || '') : (m.tonerModel || ''),
        printerName: printerDisplay
      };
    });
  });

  ngOnInit() {
    this.loading.set(true);
    
    forkJoin({
      toners: this.tonersService.getToners(),
      printers: this.printersService.getPrinters(),
      locations: this.locationsService.getLocations(),
      movements: this.movementsService.getMovements()
    }).subscribe({
      next: ({ toners, printers }) => {
        this.tonersMap = new Map(toners.map(t => [t.id, `${t.model} - ${t.color}`]));
        this.printersMap = new Map(printers.map(p => [p.id, { name: p.name, locationId: p.locationId }]));
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.showAlert('Error initializing movements data', 'Close');
      }
    });
  }

  openDialog() {
    const toners = Array.from(this.tonersMap.entries()).map(([id, label]) => ({ id, label }));
    const printers = Array.from(this.printersMap.entries()).map(([id, { name }]) => ({ id, name }));
    const ref = this.dialog.open(MovementForm, { width: '560px', data: { toners, printers } });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.movementsService.createMovement(result).subscribe({
          next: () => {
            this.showAlert('Movement created successfully', 'Close');
          },
          error: (err) => {
            let errorMessage = 'Error creating movement';
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

