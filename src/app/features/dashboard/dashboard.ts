import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TonersService } from '../toner/services/toner-service';
import { PrintersService } from '../printer/services/printer-service';
import { MovementsService } from '../movement/services/movement-service';
import { LocationsService } from '../location/services/location-service';
import { TranslationService } from '../../core/services/translation.service';
import { AuthService } from '../../core/services/auth.service';
import { MovementForm } from '../movement/components/movement-form/movement-form';
import { UiTableComponent } from '../../shared/components/ui-table/ui-table';
import { TranslateModule } from '@ngx-translate/core';
import { IToner } from '../toner/types';
import { IPrinter } from '../printer/types';
import { IMovement } from '../movement/types';
import { ILocation } from '../location/types';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatButtonModule, MatSnackBarModule, MatDialogModule, UiTableComponent, TranslateModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private tonersService = inject(TonersService);
  private printersService = inject(PrintersService);
  private movementsService = inject(MovementsService);
  private locationsService = inject(LocationsService);
  private translationService = inject(TranslationService);
  public authService = inject(AuthService);
  private _snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  toners = this.tonersService.toners;
  lowToners = this.tonersService.lowToners;
  printers = this.printersService.printers;
  locations = this.locationsService.locations;
  movements = this.movementsService.movements;
  loading = signal<boolean>(false);

  tonersInStock = computed(() =>
    this.toners().reduce((sum, t) => sum + (t.quantity ?? 0), 0)
  );
  lowTonersCount = computed(() => this.lowToners().length);
  activePrintersCount = computed(() => this.printers().length);
  movementsToday = computed(() => {
    const today = new Date().toDateString();
    return this.movements().filter(
      (m) => new Date(m.createdAt).toDateString() === today
    ).length;
  });

  movementsWithNames = computed(() => {
    this.translationService.currentLangSignal();
    const list = this.movements();
    const tonersMap = new Map(this.toners().map((t) => [t.id, `${t.model} - ${t.color}`]));
    const printersMap = new Map(this.printers().map((p) => [p.id, { name: p.name, locationId: p.locationId }]));
    const locationsMap = new Map(this.locations().map((l) => [l.id, l.name]));

    return list.map((m) => {
      const printer = m.printerId ? printersMap.get(m.printerId) : null;
      const locationName = printer ? locationsMap.get(printer.locationId) : '';
      const printerDisplay = printer
        ? `${printer.name} - ${locationName || this.translationService.instant('shared.no_location')}`
        : (m.printerName ?? '');

      return {
        ...m,
        tonerModel: m.tonerId ? (tonersMap.get(m.tonerId) ?? m.tonerModel ?? '') : (m.tonerModel ?? ''),
        printerName: printerDisplay,
      };
    });
  });

  recentMovements = computed(() => {
    const withNames = this.movementsWithNames();
    return [...withNames]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  });

  recentMovementsColumns = computed(() => {
    this.translationService.currentLangSignal();
    return [
      { id: 'createdAt', header: this.translationService.instant('shared.columns.date'), field: 'createdAt', type: 'date' as const, dateFormat: 'dd/MM' },
      { id: 'printerName', header: this.translationService.instant('movements.columns.printer'), field: 'printerName', type: 'text' as const },
      {
        id: 'type',
        header: this.translationService.instant('movements.columns.type'),
        field: 'type',
        type: 'icon' as const,
        transform: (val: string) => val?.toString().toLowerCase() === 'in' ? 'arrow_upward' : 'arrow_downward',
        colorTransform: (val: string) => val?.toString().toLowerCase() === 'in' ? '#2e7d32' : '#c62828',
        tooltipTransform: (val: string) => val?.toString().toLowerCase() === 'in'
          ? this.translationService.instant('movements.type_in')
          : this.translationService.instant('movements.type_out'),
      },
      { id: 'tonerModel', header: this.translationService.instant('movements.columns.toner'), field: 'tonerModel', type: 'text' as const },
      { id: 'quantity', header: this.translationService.instant('movements.columns.quantity'), field: 'quantity', type: 'text' as const },
    ];
  });

  // ─── Low Stock Toners table ───────────────────────────────────────────────

  lowTonersTableData = computed(() =>
    [...this.lowToners()]
      .sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0))
      .slice(0, 3)
  );

  extraLowTonersCount = computed(() => Math.max(0, this.lowToners().length - 3));

  lowTonersColumns = computed(() => {
    this.translationService.currentLangSignal();
    return [
      { id: 'manufacturer', header: this.translationService.instant('toners.columns.manufacturer'), field: 'manufacturer', type: 'text' as const },
      { id: 'model', header: this.translationService.instant('toners.columns.model'), field: 'model', type: 'text' as const },
      { id: 'color', header: this.translationService.instant('toners.columns.color'), field: 'color', type: 'text' as const },
      { id: 'quantity', header: this.translationService.instant('toners.columns.quantity'), field: 'quantity', type: 'text' as const },
    ];
  });

  // ─────────────────────────────────────────────────────────────────────────

  private readonly lowStockThreshold = 3;

  ngOnInit() {
    // Use OR (||) instead of AND (&&) because any cached entity means we can show something 
    // and avoid a full-page loading flicker
    const hasCache = this.toners().length > 0 || 
                     this.printers().length > 0 || 
                     this.locations().length > 0 || 
                     this.movements().length > 0;

    if (!hasCache) {
      this.loading.set(true);
    }

    forkJoin({
      toners: this.tonersService.getToners(),
      lowToners: this.tonersService.getLowStock(this.lowStockThreshold),
      printers: this.printersService.getPrinters(),
      locations: this.locationsService.getLocations(),
      movements: this.movementsService.getMovements(),
    }).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showAlert(
          this.translationService.instant('dashboard.alerts.fetch_error'),
          this.translationService.instant('shared.actions.close')
        );
      },
    });
  }

  openNewMovement() {
    const toners = this.toners().map((t) => ({
      id: t.id,
      label: `${t.model} - ${t.color}`,
    }));
    const locationsMap = new Map(this.locations().map((l) => [l.id, l.name]));
    const printers = this.printers().map((p) => ({
      id: p.id,
      name: p.locationId
        ? `${p.name} - ${locationsMap.get(p.locationId) ?? p.name}`
        : p.name,
    }));
    const ref = this.dialog.open(MovementForm, {
      width: '560px',
      data: { toners, printers },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.movementsService.createMovement(result).subscribe({
          next: () => {
            this.showAlert(
              this.translationService.instant('movements.alerts.created'),
              this.translationService.instant('shared.actions.close')
            );
          },
          error: (err) => {
            const errorMessage =
              err?.status === 400 && err?.error?.errors?.[0]?.message
                ? err.error.errors[0].message
                : this.translationService.instant('movements.alerts.create_error');
            this.showAlert(errorMessage, this.translationService.instant('shared.actions.close'));
          },
        });
      }
    });
  }

  goToHistory() {
    this.router.navigate(['/movements']);
  }

  goToToners() {
    this.router.navigate(['/toners']);
  }

  private showAlert(msg: string, action: string) {
    this._snackBar.open(msg, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}
