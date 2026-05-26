import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, lastValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDrawerContainer, MatDrawer, MatDrawerContent } from '@angular/material/sidenav';
import { MatToolbar } from '@angular/material/toolbar';
import { Router, RouterOutlet } from "@angular/router";
import { Logo } from "../../components/logo/logo";
import { Navbar } from "../../components/navbar/navbar";
import { NavItem } from '../../components/navbar/types';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-default-layout',
  imports: [
    CommonModule, 
    MatDrawerContainer, 
    MatDrawer, 
    MatDrawerContent, 
    MatToolbar, 
    MatButtonModule, 
    MatIcon, 
    RouterOutlet, 
    Logo, 
    Navbar, 
    MatDividerModule, 
    MatProgressSpinnerModule, 
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './default-layout.html',
  styleUrl: './default-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultLayout implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  
  /** Mobile state based on viewport breakpoint */
  protected isMobile = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map(r => r.matches)),
    { initialValue: false }
  );

  /** Current authenticated user derived from AuthService */
  protected user = this.authService.currentUser;
  protected isAdmin = this.authService.isAdmin;
  
  /** Loading state for the logout process */
  protected isLoggingOut = signal(false);

  ngOnInit() {}
  
  /**
   * Handles the logout process.
   * Clears session and redirects to login page.
   */
  async onLogout() {
    this.isLoggingOut.set(true);
    
    try {
      await lastValueFrom(this.authService.logout());
      this.router.navigate(['/login']);
    } catch (error) {
      // Force local logout even if the server request fails
      this.router.navigate(['/login']);
    } finally {
      this.isLoggingOut.set(false);
    }
  }

  protected readonly NavItems = computed(() => {
    this.translationService.currentLangSignal();
    const items: Array<NavItem> = [
      { route: '/dashboard', icon: 'dashboard', name: this.translationService.instant('nav.dashboard') },
      { route: '/toners', icon: 'inventory_2', name: this.translationService.instant('nav.toners') },
      { route: '/printers', icon: 'print', name: this.translationService.instant('nav.printers') },
      { route: '/locations', icon: 'location_on', name: this.translationService.instant('nav.locations') },
      { route: '/movements', icon: 'swap_horiz', name: this.translationService.instant('nav.movements') }
    ];

    if (this.isAdmin()) {
      items.push({ route: '/users', icon: 'manage_accounts', name: this.translationService.instant('nav.users') });
    }

    return items;
  });
}
