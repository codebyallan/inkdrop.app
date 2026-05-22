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
import { TranslationService } from '../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-movement',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, PageLayoutComponent, UiTableComponent, MatDialogModule, TranslateModule],
  templateUrl: './movement.html',
  styleUrl: './movement.scss',
})
export class Movement implements OnInit {
  private movementsService = inject(MovementsService);
  private tonersService = inject(TonersService);
  private printersService = inject(PrintersService);
  private locationsService = inject(LocationsService);
  private translationService = inject(TranslationService);
  private _snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  movements = this.movementsService.movements;
  locations = this.locationsService.locations;
  private tonersMap = new Map<string, string>();
  private printersMap = new Map<string, { name: string, locationId: string }>();
  loading = signal<boolean>(true);
  columnsConfig = computed(() => {
    this.translationService.currentLangSignal();
    return [
      { id: 'tonerModel', header: this.translationService.instant('movements.columns.toner'), field: 'tonerModel', type: 'text' as const },
      { id: 'printerName', header: this.translationService.instant('movements.columns.printer'), field: 'printerName', type: 'text' as const },
      { id: 'quantity', header: this.translationService.instant('movements.columns.quantity'), field: 'quantity', type: 'text' as const },
      { 
        id: 'type', 
        header: this.translationService.instant('movements.columns.type'), 
        field: 'type', 
        type: 'text' as const,
        transform: (val: any) => (val?.toString().toLowerCase() === 'in') 
          ? this.translationService.instant('movements.type_in') 
          : this.translationService.instant('movements.type_out')
      },
      { id: 'description', header: this.translationService.instant('movements.columns.description'), field: 'description', type: 'text' as const },
      { id: 'createdAt', header: this.translationService.instant('movements.columns.created_at'), field: 'createdAt', type: 'date' as const, dateFormat: 'dd/MM/yyyy' }
    ];
  });

  // Computed signal to handle the dynamic composition of Printer - Location
  movementsWithDetails = computed(() => {
    this.translationService.currentLangSignal();
    const list = this.movements();
    const tonersMap = this.tonersMap;
    const printersMap = this.printersMap;
    const locationsMap = new Map(this.locations().map(l => [l.id, l.name]));

    return list.map(m => {
      const printer = m.printerId ? printersMap.get(m.printerId) : null;
      const locationName = printer ? locationsMap.get(printer.locationId) : '';
      const printerDisplay = printer 
        ? `${printer.name} - ${locationName || this.translationService.instant('shared.no_location')}` 
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
        this.showAlert(this.translationService.instant('movements.alerts.fetch_error'), this.translationService.instant('shared.actions.close'));
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
            this.showAlert(this.translationService.instant('movements.alerts.created'), this.translationService.instant('shared.actions.close'));
          },
          error: (err) => {
            let errorMessage = this.translationService.instant('movements.alerts.create_error');
            if (err?.status === 400 && err?.error?.errors && err.error.errors[0]?.message) {
              errorMessage = err.error.errors[0].message;
            }
            this.showAlert(errorMessage, this.translationService.instant('shared.actions.close'));
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

