import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { TonerCard } from './components/toner-card/toner-card.component';
import { TonerCardSkeleton } from './components/toner-card-skeleton/toner-card-skeleton.component';
import { TonersService } from './services/toner.service';
import { IToner } from '../../types/toner.type';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { TonerForm } from './components/toner-form/toner-form.component';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-toner',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressBarModule, PageLayoutComponent, TonerCard, TonerCardSkeleton, MatDialogModule, TranslateModule],
  templateUrl: './toner.component.html',
  styleUrl: './toner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toner implements OnInit {
  private tonersService = inject(TonersService);
  private translationService = inject(TranslationService);
  private _snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  public authService = inject(AuthService);

  toners = this.tonersService.toners;
  sortedToners = computed(() => {
    return [...this.toners()].sort((a, b) => a.model.localeCompare(b.model));
  });
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loading.set(true);
    this.tonersService.getToners().subscribe({
      next: () => {
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
    this.tonersService.getToners(true).subscribe({
      next: () => {
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
        this.tonersService.updateToner(row.id, values).subscribe({
          next: () => {
            this.showAlert(this.translationService.instant('toners.alerts.updated'), this.translationService.instant('shared.actions.close'));
          },
          error: () => this.showAlert(this.translationService.instant('toners.alerts.update_error'), this.translationService.instant('shared.actions.close'))
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

