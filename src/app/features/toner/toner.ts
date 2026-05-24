import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout';
import { UiTableComponent } from '../../shared/components/ui-table/ui-table';
import { TonersService } from './services/toner-service';
import { IToner } from './types';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { TonerForm } from './components/toner-form/toner-form';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-toner',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, PageLayoutComponent, UiTableComponent, MatDialogModule, TranslateModule],
  templateUrl: './toner.html',
  styleUrl: './toner.scss',
})
export class Toner implements OnInit {
  private tonersService = inject(TonersService);
  private translationService = inject(TranslationService);
  private _snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  public authService = inject(AuthService);

  toners = this.tonersService.toners;
  loading = signal<boolean>(true);
  columnsConfig = computed(() => {
    this.translationService.currentLangSignal();
    return [
      { id: 'manufacturer', header: this.translationService.instant('toners.columns.manufacturer'), field: 'manufacturer', type: 'text' as const },
      { id: 'model', header: this.translationService.instant('toners.columns.model'), field: 'model', type: 'text' as const },
      { id: 'color', header: this.translationService.instant('toners.columns.color'), field: 'color', type: 'text' as const },
      { id: 'quantity', header: this.translationService.instant('toners.columns.quantity'), field: 'quantity', type: 'text' as const },
      { id: 'createdAt', header: this.translationService.instant('toners.columns.created_at'), field: 'createdAt', type: 'date' as const, dateFormat: 'dd/MM/yyyy' },
      { id: 'actions', header: '', type: 'actions' as const }
    ];
  });

  ngOnInit() {
    this.loading.set(true);
    this.tonersService.getToners().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showAlert(this.translationService.instant('toners.alerts.fetch_error'), this.translationService.instant('shared.actions.close'));
      },
    });
  }

  onTableAction(evt: { type: string; row: IToner }) {
    if (evt.type === 'delete') {
      this.deleteToner(evt.row.id);
    } else if (evt.type === 'edit') {
      this.editToner(evt.row);
    }
  }

  editToner(row: IToner) {
    const ref = this.dialog.open(TonerForm, { width: '500px', data: { mode: 'edit', initial: { model: row.model, manufacturer: row.manufacturer, color: row.color } } });
    ref.afterClosed().subscribe(values => {
      if (values) {
        const confirmRef = this.dialog.open(ConfirmDialog, { 
          width: '300px', 
          data: { 
            title: this.translationService.instant('shared.confirm_dialog.save_changes_title'), 
            message: this.translationService.instant('shared.confirm_dialog.save_changes_message'), 
            confirmLabel: this.translationService.instant('shared.actions.save'), 
            cancelLabel: this.translationService.instant('shared.actions.cancel') 
          } 
        });
        confirmRef.afterClosed().subscribe(confirmed => {
          if (confirmed) {
            this.tonersService.updateToner(row.id, values).subscribe({
              next: () => {
                this.showAlert(this.translationService.instant('toners.alerts.updated'), this.translationService.instant('shared.actions.close'));
              },
              error: () => this.showAlert(this.translationService.instant('toners.alerts.update_error'), this.translationService.instant('shared.actions.close'))
            });
          }
        });
      }
    });
  }

  deleteToner(id: string) {
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
        this.tonersService.deleteToner(id).subscribe({
          next:  () => this.showAlert(this.translationService.instant('toners.alerts.deleted'), this.translationService.instant('shared.actions.close')),
          error: () => this.showAlert(this.translationService.instant('toners.alerts.delete_error'), this.translationService.instant('shared.actions.close')),
        });
      }
    });
  }

  openDialog() {
    const ref = this.dialog.open(TonerForm, { width: '500px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.tonersService.createToner(result).subscribe({
          next: () => {
            this.showAlert(this.translationService.instant('toners.alerts.created'), this.translationService.instant('shared.actions.close'));
          },
          error: (err) => {
            let errorMessage = this.translationService.instant('toners.alerts.create_error');
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

