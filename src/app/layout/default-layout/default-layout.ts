import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDrawerContainer, MatDrawer, MatDrawerContent } from '@angular/material/sidenav';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterOutlet } from "@angular/router";
import { Logo } from "../../components/logo/logo";
import { Navbar } from "../../components/navbar/navbar";
import { NavItem } from '../../components/navbar/types';

@Component({
  selector: 'app-default-layout',
  imports: [MatDrawerContainer, MatDrawer, MatDrawerContent, MatToolbar, MatButtonModule, MatIcon, RouterOutlet, Logo, Navbar],
  templateUrl: './default-layout.html',
  styleUrl: './default-layout.scss',
})
export class DefaultLayout implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  protected isMobile = signal<boolean>(false);
  ngOnInit() {
    this.breakpointObserver.observe(Breakpoints.Handset).subscribe(result => {
      this.isMobile.set(result.matches);
    });
  }
  protected readonly NavItems: Array<NavItem> = [
    { route: '/dashboard', icon: 'dashboard', name: 'Dashboard' },
    { route: '/toners', icon: 'inventory_2', name: 'Toners' },
    { route: '/printers', icon: 'print', name: 'Printers' },
    { route: '/locations', icon: 'location_on', name: 'Locations' },
    { route: '/movements', icon: 'swap_horiz', name: 'Movements' }
  ];
}
