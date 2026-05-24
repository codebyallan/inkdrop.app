import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout';
import { UiTableComponent } from '../../shared/components/ui-table/ui-table';
import { UserService } from './services/user-service';
import { IUser, ROLE_MAP, UserRole } from './types';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { UserForm } from './components/user-form/user-form';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressBarModule, PageLayoutComponent, UiTableComponent, MatDialogModule, TranslateModule],
  templateUrl: './user.html',
  styleUrl: './user.scss',
})
export class User implements OnInit {
  private userService = inject(UserService);
  private translationService = inject(TranslationService);
  private _snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  public authService = inject(AuthService);

  users = this.userService.users;
  loading = signal<boolean>(true);

  columnsConfig = computed(() => {
    this.translationService.currentLangSignal();
    return [
      { id: 'username', header: this.translationService.instant('users.columns.username'), field: 'username', type: 'text' as const },
      { id: 'email', header: this.translationService.instant('users.columns.email'), field: 'email', type: 'text' as const },
      { 
        id: 'role', 
        header: this.translationService.instant('users.columns.role'), 
        field: 'role', 
        type: 'text' as const, 
        transform: (val: any) => {
          if (val === 'Admin') return this.translationService.instant('users.role_admin');
          if (val === 'Technician') return this.translationService.instant('users.role_technician');
          
          const numericRole = Number(val);
          const roleLabel = ROLE_MAP[numericRole as UserRole];
          
          if (roleLabel) {
            if (roleLabel === 'Admin') return this.translationService.instant('users.role_admin');
            if (roleLabel === 'Technician') return this.translationService.instant('users.role_technician');
            return roleLabel;
          }

          return this.translationService.instant('users.role_unknown');
        } 
      },
      { id: 'isActive', header: this.translationService.instant('users.columns.status'), field: 'isActive', type: 'badge' as const },
      { id: 'createdAt', header: this.translationService.instant('users.columns.created_at'), field: 'createdAt', type: 'date' as const, dateFormat: 'dd/MM/yyyy' },
      { id: 'actions', header: '', type: 'actions' as const }
    ];
  });

  ngOnInit() {
    this.loading.set(true);
    this.userService.getUsers().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showAlert(this.translationService.instant('users.alerts.fetch_error'), this.translationService.instant('shared.actions.close'));
      },
    });
  }

  refresh() {
    this.loading.set(true);
    this.userService.getUsers(true).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showAlert(this.translationService.instant('users.alerts.fetch_error'), this.translationService.instant('shared.actions.close'));
      },
    });
  }

  onTableAction(evt: { type: string; row: IUser }) {
    if (evt.type === 'delete') {
      this.deleteUser(evt.row.id);
    } else if (evt.type === 'edit') {
      this.editUser(evt.row);
    } else if (evt.type === 'toggle') {
      this.toggleUserStatus(evt.row);
    }
  }

  editUser(row: IUser) {
    const ref = this.dialog.open(UserForm, { 
      width: '500px', 
      data: { 
        mode: 'edit', 
        initial: { id: row.id, username: row.username, email: row.email, role: row.role } 
      } 
    });
    
    ref.afterClosed().subscribe(values => {
      if (values) {
        if (row.id === this.authService.currentUser()?.id && values.role !== row.role) {
          this.showAlert(this.translationService.instant('users.alerts.cannot_change_own_role'), this.translationService.instant('shared.actions.close'));
          return;
        }

        this.userService.updateUser(row.id, values).subscribe({
          next: () => {
            this.showAlert(this.translationService.instant('users.alerts.updated'), this.translationService.instant('shared.actions.close'));
          },
          error: () => this.showAlert(this.translationService.instant('users.alerts.update_error'), this.translationService.instant('shared.actions.close'))
        });
      }
    });
  }

  deleteUser(id: string) {
    if (id === this.authService.currentUser()?.id) {
      this.showAlert(this.translationService.instant('users.alerts.cannot_delete_self'), this.translationService.instant('shared.actions.close'));
      return;
    }

    const ref = this.dialog.open(ConfirmDialog, { 
      width: '300px', 
      data: { 
        title: this.translationService.instant('shared.confirm_dialog.delete_user_title'), 
        message: this.translationService.instant('shared.confirm_dialog.delete_user_message'), 
        confirmLabel: this.translationService.instant('shared.actions.delete'), 
        cancelLabel: this.translationService.instant('shared.actions.cancel') 
      } 
    });
    
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.userService.deleteUser(id).subscribe({
          next: () => {
            this.showAlert(this.translationService.instant('users.alerts.deleted'), this.translationService.instant('shared.actions.close'));
          },
          error: () => this.showAlert(this.translationService.instant('users.alerts.delete_error'), this.translationService.instant('shared.actions.close'))
        });
      }
    });
  }

  toggleUserStatus(row: IUser) {
    if (row.id === this.authService.currentUser()?.id && row.isActive) {
      this.showAlert(this.translationService.instant('users.alerts.cannot_deactivate_self'), this.translationService.instant('shared.actions.close'));
      return;
    }

    const action = row.isActive ? 'deactivate' : 'activate';
    const message = row.isActive ? this.translationService.instant('shared.confirm_dialog.deactivate_message') : this.translationService.instant('shared.confirm_dialog.activate_message');
    
    const ref = this.dialog.open(ConfirmDialog, { 
      width: '300px', 
      data: { 
        title: this.translationService.instant('shared.confirm_dialog.status_change_title'), 
        message, 
        confirmLabel: this.translationService.instant('shared.actions.confirm'), 
        cancelLabel: this.translationService.instant('shared.actions.cancel') 
      } 
    });

    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const isDeactivating = row.isActive;
        const successKey = isDeactivating ? 'users.alerts.deactivated' : 'users.alerts.activated';
        const errorKey   = isDeactivating ? 'users.alerts.deactivate_error' : 'users.alerts.activate_error';

        const serviceCall = isDeactivating
          ? this.userService.deactivateUser(row.id)
          : this.userService.activateUser(row.id);

        serviceCall.subscribe({
          next:  () => this.showAlert(this.translationService.instant(successKey), this.translationService.instant('shared.actions.close')),
          error: () => this.showAlert(this.translationService.instant(errorKey), this.translationService.instant('shared.actions.close')),
        });
      }
    });
  }

  openDialog() {
    const ref = this.dialog.open(UserForm, { width: '500px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.userService.createUser(result).subscribe({
          next: () => {
            this.showAlert(this.translationService.instant('users.alerts.created'), this.translationService.instant('shared.actions.close'));
          },
          error: (err) => {
            let errorMessage = this.translationService.instant('users.alerts.create_error');
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
