import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDrawerContainer, MatDrawer, MatDrawerContent } from '@angular/material/sidenav';
import { MatToolbar } from '@angular/material/toolbar';
import { Router, RouterOutlet, RouterLink } from "@angular/router";
import { Logo } from "../../components/logo/logo.component";
import { Navbar } from "../../components/navbar/navbar.component";
import { NavItem } from '../../types/nav-item.type';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';
// CommonModule removed

@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [
    MatDrawerContainer, 
    MatDrawer, 
    MatDrawerContent, 
    MatToolbar, 
    MatButtonModule, 
    MatIcon, 
    RouterOutlet, 
    RouterLink,
    MatTooltipModule,
    Logo, 
    Navbar, 
    MatDividerModule, 
    TranslateModule
  ],
  templateUrl: './default-layout.component.html',
  styleUrl: './default-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultLayout implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private router = inject(Router);
  
  /** Mobile state based on viewport breakpoint */
  protected isMobile = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map(r => r.matches)),
    { initialValue: false }
  );

  /** Current authenticated user derived from AuthService */
  protected user = this.authService.currentUser;
  protected isAdmin = this.authService.isAdmin;

  ngOnInit() {}

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
