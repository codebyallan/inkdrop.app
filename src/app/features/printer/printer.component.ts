import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DatePipe } from '@angular/common';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout';
import { UiTableComponent, ColumnDef } from '../../shared/components/ui-table/ui-table';
import { PrintersService } from './services/printer-service';
import { IPrinter } from './types';
import { LocationsService } from '../location/services/location-service';
import { ILocation } from '../location/types';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PrinterForm } from './components/printer-form/printer-form.component';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-printer',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressBarModule, PageLayoutComponent, UiTableComponent, MatDialogModule, TranslateModule],
  templateUrl: './printer.component.html',
  styleUrl: './printer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Printer implements OnInit {
  private printersService = inject(PrintersService);
  private translationService = inject(TranslationService);
  private _snackBar = inject(MatSnackBar);
  private locationsService = inject(LocationsService);
  private dialog = inject(MatDialog);
  public authService = inject(AuthService);

  printers = this.printersService.printers;
  private locationsMap = new Map<string, string>();
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  columnsConfig = computed<ColumnDef<IPrinter>[]>(() => {
    this.translationService.currentLangSignal();
    return [
      { id: 'name', header: this.translationService.instant('printers.columns.name'), field: 'name', type: 'text' as const },
      { id: 'manufacturer', header: this.translationService.instant('printers.columns.manufacturer'), field: 'manufacturer', type: 'text' as const },
      { id: 'model', header: this.translationService.instant('printers.columns.model'), field: 'model', type: 'text' as const },
      { id: 'ipAddress', header: this.translationService.instant('printers.columns.ip_address'), field: 'ipAddress', type: 'text' as const },
      { id: 'locationName', header: this.translationService.instant('printers.columns.location'), field: 'locationName', type: 'text' as const },
      { id: 'createdAt', header: this.translationService.instant('printers.columns.created_at'), field: 'createdAt', type: 'date' as const, dateFormat: 'dd/MM/yyyy' },
      { id: 'actions', header: '', type: 'actions' as const }
    ];
  });

  ngOnInit() {
    this.loading.set(true);
    
    forkJoin({
      locations: this.locationsService.getLocations(),
      printers: this.printersService.getPrinters()
    }).subscribe({
      next: ({ locations }) => {
        this.locationsMap = new Map(locations.map(l => [l.id, l.name]));
        this.printersService.applyLocationNames(this.locationsMap);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err: any) => {
        this.loading.set(false);
        if (err.status === 400) {
          this.error.set(err.error?.message || this.translationService.instant('shared.alerts.invalid_request'));
        }
      },
    });
  }

  refresh() {
    this.loading.set(true);
    forkJoin({
      locations: this.locationsService.getLocations(true),
      printers: this.printersService.getPrinters(true)
    }).subscribe({
      next: ({ locations }) => {
        this.locationsMap = new Map(locations.map(l => [l.id, l.name]));
        this.printersService.applyLocationNames(this.locationsMap);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err: any) => {
        this.loading.set(false);
        if (err.status === 400) {
          this.error.set(err.error?.message || this.translationService.instant('shared.alerts.invalid_request'));
        }
      },
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
        this.printersService.updatePrinter(row.id, values).subscribe({
          next: () => {
            this.printersService.applyLocationNames(this.locationsMap);
            this.showAlert(this.translationService.instant('printers.alerts.updated'), this.translationService.instant('shared.actions.close'));
          },
          error: () => this.showAlert(this.translationService.instant('printers.alerts.update_error'), this.translationService.instant('shared.actions.close'))
        });
      }
    });
  }

  deletePrinter(id: string) {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '300px',
      data: {
        title:        this.translationService.instant('shared.confirm_dialog.default_title'),
        message:      this.translationService.instant('shared.confirm_dialog.default_message'),
        confirmLabel: this.translationService.instant('shared.actions.delete'),
        cancelLabel:  this.translationService.instant('shared.actions.cancel'),
        destructive:  true,
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.printersService.deletePrinter(id).subscribe({
          next:  () => this.showAlert(this.translationService.instant('printers.alerts.deleted'), this.translationService.instant('shared.actions.close')),
          error: () => this.showAlert(this.translationService.instant('printers.alerts.delete_error'), this.translationService.instant('shared.actions.close')),
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
            this.printersService.applyLocationNames(this.locationsMap);
            this.showAlert(this.translationService.instant('printers.alerts.created'), this.translationService.instant('shared.actions.close'));
          },
          error: (err) => {
            let errorMessage = this.translationService.instant('printers.alerts.create_error');
            if (err?.status === 400 && err?.error?.errors && err.error.errors[0]?.message) {
              errorMessage = err.error.errors[0].message;
            }
            this.showAlert(errorMessage, this.translationService.instant('shared.actions.close'));
          }
        });
      }
    });
  }

  private applyLocationNames() {
    // This method is now deprecated and handled by the service.
    // Kept only for compatibility if called elsewhere, but should call service.
    this.printersService.applyLocationNames(this.locationsMap);
  }

  showAlert(msg: string, action: string) {
    this._snackBar.open(msg, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}
