import { Component, EventEmitter, Output, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { IUser } from '../../types';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule, 
    TranslateModule, 
    CommonModule
  ],
  templateUrl: './user-card.html',
  styleUrl: './user-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCard {
  @Input({ required: true }) user!: IUser;
  @Output() edit = new EventEmitter<IUser>();
  @Output() delete = new EventEmitter<IUser>();
  
  public authService = inject(AuthService);

  getRoleClass(role: any): string {
    const roleStr = role?.toString().toLowerCase();
    if (roleStr === 'admin' || role === 1) return 'role-admin';
    if (roleStr === 'technician' || role === 2) return 'role-technician';
    return 'role-unknown';
  }
}
