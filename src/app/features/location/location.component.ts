import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { LocationsService } from './services/location-service';
import { ILocation } from './types';
import { ColumnDef } from '../../shared/components/ui-table/ui-table';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { LocationForm } from './components/location-form/location-form.component';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout';
import { UiTableComponent } from '../../shared/components/ui-table/ui-table';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-location',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressBarModule, PageLayoutComponent, UiTableComponent, TranslateModule],
  templateUrl: './location.component.html',
  styleUrl: './location.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Location implements OnInit {
  private locationsService = inject(LocationsService);
  private translationService = inject(TranslationService);
  private dialog = inject(MatDialog);
  private _snackBar = inject(MatSnackBar);
  public authService = inject(AuthService);

  locations = this.locationsService.locations;
  loading = signal<boolean>(true);
  columnsConfig = computed<ColumnDef<ILocation>[]>(() => {
    this.translationService.currentLangSignal();
    return [
      { id: 'name', header: this.translationService.instant('locations.columns.name'), field: 'name', type: 'text' as const },
      { id: 'description', header: this.translationService.instant('locations.columns.description'), field: 'description', type: 'text' as const },
      { id: 'createdAt', header: this.translationService.instant('locations.columns.created_at'), field: 'createdAt', type: 'date' as const, dateFormat: 'dd/MM/yyyy' },
      { id: 'actions', header: '', type: 'actions' as const }
    ];
  });

  ngOnInit() {
    this.loading.set(true);
    this.locationsService.getLocations().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.showAlert(this.translationService.instant('locations.alerts.fetch_error'), this.translationService.instant('shared.actions.close'));
      }
    });
  }

  refresh() {
    this.loading.set(true);
    this.locationsService.getLocations(true).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.showAlert(this.translationService.instant('locations.alerts.fetch_error'), this.translationService.instant('shared.actions.close'));
      }
    });
  }
  openDialog() {
    const ref = this.dialog.open(LocationForm, { width: '400px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.locationsService.createLocation(result).subscribe({
          next: () => {
            this.showAlert(this.translationService.instant('locations.alerts.created'), this.translationService.instant('shared.actions.close'));
          },
          error: (err) => {
            let errorMessage = this.translationService.instant('locations.alerts.create_error');
            if (err.status === 400 && err.error?.errors) {
              errorMessage = err.error.errors[0].message;
            }
            this.showAlert(errorMessage, this.translationService.instant('shared.actions.close'));
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
        this.locationsService.updateLocation(row.id, values).subscribe({
          next: () => {
            this.showAlert(this.translationService.instant('locations.alerts.updated'), this.translationService.instant('shared.actions.close'));
          },
          error: () => this.showAlert(
            this.translationService.instant('locations.alerts.update_error'),
            this.translationService.instant('shared.actions.close')
          )
        });
      }
    });
  }

  deleteLocation(id: string) {
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
        this.locationsService.deleteLocation(id).subscribe({
          next:  () => this.showAlert(this.translationService.instant('locations.alerts.deleted'), this.translationService.instant('shared.actions.close')),
          error: () => this.showAlert(this.translationService.instant('locations.alerts.delete_error'), this.translationService.instant('shared.actions.close')),
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
