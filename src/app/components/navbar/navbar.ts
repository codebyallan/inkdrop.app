import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list'
import { RouterModule } from '@angular/router';
import { NavItem } from './types';
@Component({
  selector: 'app-navbar',
  imports: [MatListModule, MatIconModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  items = input<NavItem[]>([]);
  itemClicked = output<void>();
  onItemClick() {
    this.itemClicked.emit();
  }
}
