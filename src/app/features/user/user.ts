import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout';
import { UiTableComponent } from '../../shared/components/ui-table/ui-table';
import { UserService } from './services/user-service';
import { IUser, ROLE_MAP, UserRole } from './types';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { UserForm } from './components/user-form/user-form';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, PageLayoutComponent, UiTableComponent, MatDialogModule],
  templateUrl: './user.html',
  styleUrl: './user.scss',
})
export class User implements OnInit {
  private userService = inject(UserService);
  private _snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  public authService = inject(AuthService);

  users = signal<IUser[]>([]);
  loading = signal<boolean>(true);

  columnsConfig = [
    { id: 'username', header: 'Username', field: 'username', type: 'text' as const },
    { id: 'email', header: 'Email', field: 'email', type: 'text' as const },
    { 
      id: 'role', 
      header: 'Role', 
      field: 'role', 
      type: 'text' as const, 
      transform: (val: any) => {
        // 1. Se já for a string 'Admin' ou 'Technician', retorna ela mesma
        if (val === 'Admin' || val === 'Technician') return val;
        
        // 2. Se for um número (ou string numérica), traduz usando o ROLE_MAP
        const numericRole = Number(val);
        const roleLabel = ROLE_MAP[numericRole as UserRole];
        
        if (roleLabel) return roleLabel;

        console.warn(`Unexpected role value received from API:`, val);
        return 'Unknown';
      } 
    },
    { id: 'isActive', header: 'Status', field: 'isActive', type: 'badge' as const },
    { id: 'createdAt', header: 'Created At', field: 'createdAt', type: 'date' as const, dateFormat: 'dd/MM/yyyy' },
    { id: 'actions', header: '', type: 'actions' as const }
  ];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showAlert('Error fetching users', 'Close');
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
          this.showAlert('You cannot change your own role', 'Close');
          return;
        }

        const confirmRef = this.dialog.open(ConfirmDialog, { 
          width: '300px', 
          data: { title: 'Confirm', message: 'Save changes?', confirmLabel: 'Save', cancelLabel: 'Cancel' } 
        });
        
        confirmRef.afterClosed().subscribe(confirmed => {
          if (confirmed) {
            this.userService.updateUser(row.id, values).subscribe({
              next: (updated) => {
                this.users.update(prev =>
                  prev.map(u => u.id === updated.id ? updated : u)
                );
                this.showAlert('User updated successfully', 'Close');
              },
              error: () => this.showAlert('Error updating user', 'Close')
            });
          }
        });
      }
    });
  }

  deleteUser(id: string) {
    if (id === this.authService.currentUser()?.id) {
      this.showAlert('You cannot delete your own account', 'Close');
      return;
    }

    const ref = this.dialog.open(ConfirmDialog, { 
      width: '300px', 
      data: { title: 'Confirm Delete', message: 'Are you sure you want to delete this user?', confirmLabel: 'Delete', cancelLabel: 'Cancel' } 
    });
    
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.userService.deleteUser(id).subscribe({
          next: () => {
            this.users.update(prev => prev.filter(u => u.id !== id));
            this.showAlert('User deleted successfully', 'Close');
          },
          error: () => this.showAlert('Error deleting user', 'Close')
        });
      }
    });
  }

  toggleUserStatus(row: IUser) {
    if (row.id === this.authService.currentUser()?.id && row.isActive) {
      this.showAlert('You cannot deactivate your own account', 'Close');
      return;
    }

    const action = row.isActive ? 'deactivate' : 'activate';
    const message = row.isActive ? 'Deactivate user?' : 'Activate user?';
    
    const ref = this.dialog.open(ConfirmDialog, { 
      width: '300px', 
      data: { title: 'Confirm Status Change', message, confirmLabel: 'Confirm', cancelLabel: 'Cancel' } 
    });

    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const serviceCall = row.isActive ? this.userService.deactivateUser(row.id) : this.userService.activateUser(row.id);
        serviceCall.subscribe({
          next: () => {
            this.users.update(prev =>
              prev.map(u => u.id === row.id ? { ...u, isActive: !row.isActive } : u)
            );
            this.showAlert(`User ${action === 'activate' ? 'activated' : 'deactivated'} successfully`, 'Close');
          },
          error: () => this.showAlert(`Error ${action}ing user`, 'Close')
        });
      }
    });
  }

  openDialog() {
    const ref = this.dialog.open(UserForm, { width: '500px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.userService.createUser(result).subscribe({
          next: (created) => {
            this.users.update(prev => [...prev, created]);
            this.showAlert('User created successfully', 'Close');
          },
          error: (err) => {
            let errorMessage = 'Error creating user';
            if (err?.status === 400 && err?.error?.errors && err.error.errors[0]?.message) {
              errorMessage = err.error.errors[0].message;
            }
            this.showAlert(errorMessage, 'Close');
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
