import { Component, inject, input, output, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list'
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { NavItem } from './types';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [MatListModule, MatIconModule, RouterModule, MatButtonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private authService = inject(AuthService);
  
  items = input<NavItem[]>([]);
  itemClicked = output<void>();

  // Expose current user as a signal for the template
  user = computed(() => this.authService.currentUser());

  onItemClick() {
    this.itemClicked.emit();
  }

  async onLogout() {
    try {
      await this.authService.logout().toPromise();
    } catch (error) {
      console.error('Logout failed', error);
    }
  }
}
