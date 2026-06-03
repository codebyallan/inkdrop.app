import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TonersService } from '../toner/services/toner.service';
import { PrintersService } from '../printer/services/printer.service';
import { MovementsService } from '../movement/services/movement.service';
import { LocationsService } from '../location/services/location.service';
import { ReportsService } from '../reports/services/reports.service';
import { TranslationService } from '../../core/services/translation.service';
import { AuthService } from '../../core/services/auth.service';
import { MovementForm } from '../movement/components/movement-form/movement-form.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { IToner } from '../../types/toner.type';
import { IPrinter, ITonerTelemetry } from '../../types/printer.type';
import { IMovement } from '../../types/movement.type';
import { ILocation } from '../../types/location.type';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatSnackBarModule, 
    MatDialogModule, 
    MatTooltipModule,
    TranslateModule, 
    DatePipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private tonersService = inject(TonersService);
  private printersService = inject(PrintersService);
  private movementsService = inject(MovementsService);
  private locationsService = inject(LocationsService);
  private reportsService = inject(ReportsService);
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
  error = signal<string | null>(null);

  // --- Operational Risk KPIs ---
  
  private isTonerInsumo(toner: ITonerTelemetry): boolean {
    const maintenanceKeywords = ['recolha', 'collection', 'waste', 'manutenção', 'maintenance'];
    const identifier = (toner.color || '').toLowerCase();
    return !maintenanceKeywords.some(keyword => identifier.includes(keyword));
  }

  operationalCriticalCount = computed(() => {
    return this.printers().flatMap(p => 
      (p.telemetry?.toners || []).filter((t: ITonerTelemetry) => this.isTonerInsumo(t) && t.level <= 1)
    ).length;
  });

  operationalAttentionCount = computed(() => {
    return this.printers().flatMap(p => 
      (p.telemetry?.toners || []).filter((t: ITonerTelemetry) => this.isTonerInsumo(t) && t.level <= 5)
    ).length;
  });

  fleetHealthPercent = computed(() => this.reportsService.summary()?.avgFleetHealth ?? 0);

  tonersInStock = computed(() =>
    this.toners().reduce((sum, t) => sum + (t.quantity ?? 0), 0)
  );

  logisticalCriticalCount = computed(() => 
    this.toners().filter(t => (t.quantity ?? 0) <= 3).length
  );

  tonersCriticalStockCount = computed(() => this.logisticalCriticalCount());

  activePrintersCount = computed(() => this.printers().length);
  movementsToday = computed(() => {
    const today = new Date().toDateString();
    return this.movements().filter(
      (m) => new Date(m.createdAt).toDateString() === today
    ).length;
  });
  lowTonersCount = computed(() => this.lowToners().length);

  // --- Action Widgets ---
  getMoveType(type: string | undefined): string {
    if (!type) return 'unknown';
    const normalized = type.toLowerCase().trim();
    if (normalized === 'in') return 'in';
    if (normalized === 'out') return 'out';
    return 'unknown';
  }

  urgentReplacements = computed(() => {
    const list: { printer: IPrinter, toner: ITonerTelemetry }[] = [];
    
    this.printers().forEach(p => {
      (p.telemetry?.toners || []).forEach((t: ITonerTelemetry) => {
        if (this.isTonerInsumo(t) && t.level <= 5) {
          list.push({ printer: p, toner: t });
        }
      });
    });
    return list.sort((a, b) => a.toner.level - b.toner.level).slice(0, 5);
  });

  stockReplenishments = computed(() => 
    [...this.toners()].sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0)).slice(0, 5)
  );

  activityFeed = computed(() => {
    return this.movementsService.movementsDisplay()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  });

  // Backward compatibility with old tables
  recentMovements = computed(() => this.activityFeed());
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
        transform: (val: unknown) => val?.toString().toLowerCase() === 'in' ? 'arrow_upward' : 'arrow_downward',
        colorTransform: (val: unknown) => val?.toString().toLowerCase() === 'in' ? 'var(--mat-sys-success)' : 'var(--mat-sys-error)',
        tooltipTransform: (val: unknown) => val?.toString().toLowerCase() === 'in'
          ? this.translationService.instant('movements.type_in')
          : this.translationService.instant('movements.type_out'),
      },
      { id: 'tonerModel', header: this.translationService.instant('movements.columns.toner'), field: 'tonerModel', type: 'text' as const },
      { id: 'quantity', header: this.translationService.instant('movements.columns.quantity'), field: 'quantity', type: 'text' as const },
    ];
  });

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

  ngOnInit() {
    const hasCache = this.toners().length > 0 || 
                     this.printers().length > 0 || 
                     this.locations().length > 0 || 
                     this.movements().length > 0;

    if (!hasCache) {
      this.loading.set(true);
    }

    // Use forkJoin to fetch all dashboard data and the executive summary in parallel.
    // This ensures that fleetHealthPercent is synced with the Reports module API.
    forkJoin({
      toners: this.tonersService.getToners(),
      lowToners: this.tonersService.getLowStock(3),
      printers: this.printersService.getPrinters(),
      locations: this.locationsService.getLocations(),
      movements: this.movementsService.getMovements(),
      summary: this.reportsService.getExecutiveSummary(),
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 400) {
          this.error.set(err.error?.message || this.translationService.instant('shared.alerts.invalid_request'));
        }
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
