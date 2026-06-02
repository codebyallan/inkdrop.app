import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { PrinterCard } from './components/printer-card/printer-card.component';
import { PrinterCardSkeleton } from './components/printer-card-skeleton/printer-card-skeleton.component';
import { PrintersService } from './services/printer.service';
import { IPrinter } from '../../types/printer.type';
import { LocationsService } from '../location/services/location.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PrinterForm } from './components/printer-form/printer-form.component';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-printer',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressBarModule, PageLayoutComponent, PrinterCard, PrinterCardSkeleton, MatDialogModule, TranslateModule],
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
  sortedPrinters = computed(() => {
    return [...this.printers()].sort((a, b) => {
      const locA = a.locationName?.toLowerCase() || '';
      const locB = b.locationName?.toLowerCase() || '';
      return locA.localeCompare(locB);
    });
  });
  private locationsMap = new Map<string, string>();
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

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
      error: (err: HttpErrorResponse) => {
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
      error: (err: HttpErrorResponse) => {
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

  showAlert(msg: string, action: string) {
    this._snackBar.open(msg, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}
