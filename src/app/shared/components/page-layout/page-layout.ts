import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-layout',
  imports: [],
  templateUrl: './page-layout.html',
  styleUrl: './page-layout.scss',
})
export class PageLayoutComponent {
  title = input<string>('');
  subtitle = input<string | undefined>(undefined);
}

