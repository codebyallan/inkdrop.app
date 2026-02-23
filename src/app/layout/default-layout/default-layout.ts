import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDrawerContainer, MatDrawer, MatDrawerContent } from '@angular/material/sidenav';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterOutlet } from "@angular/router";
import { Logo } from "../../components/logo/logo";

@Component({
  selector: 'app-default-layout',
  imports: [MatDrawerContainer, MatDrawer, MatDrawerContent, MatToolbar, MatButtonModule, MatIcon, RouterOutlet, Logo],
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
}
