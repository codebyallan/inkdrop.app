import { Component, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { IUser } from '../../../../types/user.type';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule, 
    TranslateModule, 
    DatePipe
  ],
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCard {
  user = input.required<IUser>();
  edit = output<IUser>();
  delete = output<IUser>();
  
  public authService = inject(AuthService);

  getRoleClass(role: string | number | undefined): string {
    const roleStr = role?.toString().toLowerCase();
    if (roleStr === 'admin' || role === 1) return 'role-admin';
    if (roleStr === 'technician' || role === 2) return 'role-technician';
    return 'role-unknown';
  }
}
