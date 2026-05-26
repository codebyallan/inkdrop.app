import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressBarModule, PageLayoutComponent, UiTableComponent, MatDialogModule, TranslateModule],
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
  loading = signal<boolean>(false);
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
        type: 'icon' as const,
        transform: (val: unknown) => val?.toString().toLowerCase() === 'in' ? 'arrow_upward' : 'arrow_downward',
        colorTransform: (val: unknown) => val?.toString().toLowerCase() === 'in' ? '#2e7d32' : '#c62828',
        tooltipTransform: (val: unknown) =>
          val?.toString().toLowerCase() === 'in' ? this.translationService.instant('movements.type_in') : this.translationService.instant('movements.type_out'),
      },
      { id: 'description', header: this.translationService.instant('movements.columns.description'), field: 'description', type: 'text' as const },
      { id: 'createdAt', header: this.translationService.instant('movements.columns.created_at'), field: 'createdAt', type: 'date' as const, dateFormat: 'dd/MM/yyyy' }
    ];
  });

  // Derived signals to handle the dynamic composition of Printer - Location
  // Using computed signals instead of plain Maps to ensure reactivity with SWR
  private tonersMap = computed(() => {
    return new Map(this.tonersService.toners().map(t => [t.id, `${t.model} - ${t.color}`]));
  });

  private printersMap = computed(() => {
    return new Map(this.printersService.printers().map(p => [p.id, { name: p.name, locationId: p.locationId }]));
  });

  movementsWithDetails = computed(() => {
    this.translationService.currentLangSignal();
    const list = this.movements();
    const tMap = this.tonersMap();
    const pMap = this.printersMap();
    const locationsMap = new Map(this.locations().map(l => [l.id, l.name]));

    return list.map(m => {
      const printer = m.printerId ? pMap.get(m.printerId) : null;
      const locationName = printer ? locationsMap.get(printer.locationId) : '';
      const printerDisplay = printer 
        ? `${printer.name} - ${locationName || this.translationService.instant('shared.no_location')}` 
        : (m.printerName || '');

      return {
        ...m,
        tonerModel: m.tonerId ? (tMap.get(m.tonerId) || m.tonerModel || '') : (m.tonerModel || ''),
        printerName: printerDisplay
      };
    });
  });

  ngOnInit() {
    // Only show loading if we have absolutely no data in any of the required signals
    const hasCache = this.movements().length > 0 || 
                     this.tonersService.toners().length > 0 || 
                     this.printersService.printers().length > 0 || 
                     this.locations().length > 0;

    if (!hasCache) {
      this.loading.set(true);
    }
    
    forkJoin({
      toners: this.tonersService.getToners(),
      printers: this.printersService.getPrinters(),
      locations: this.locationsService.getLocations(),
      movements: this.movementsService.getMovements()
    }).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.showAlert(this.translationService.instant('movements.alerts.fetch_error'), this.translationService.instant('shared.actions.close'));
      }
    });
  }

  refresh() {
    this.loading.set(true);
    forkJoin({
      toners:    this.tonersService.getToners(true),
      printers:  this.printersService.getPrinters(true),
      locations: this.locationsService.getLocations(true),
      movements: this.movementsService.getMovements(true),
    }).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.showAlert(this.translationService.instant('movements.alerts.fetch_error'), this.translationService.instant('shared.actions.close'));
      },
    });
  }

  openDialog() {
    const tMap = this.tonersMap();
    const locationsMap = new Map(this.locations().map(l => [l.id, l.name]));
    const pMap = this.printersMap();
    
    const toners = Array.from(tMap.entries()).map(([id, label]) => ({ id, label }));
    const printers = Array.from(pMap.entries()).map(([id, { name, locationId }]) => ({
      id,
      name: locationId ? `${name} - ${locationsMap.get(locationId) ?? name}` : name,
    }));
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

