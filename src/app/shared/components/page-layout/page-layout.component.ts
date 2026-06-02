import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './page-layout.component.html',
  styleUrl: './page-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutComponent {
  title = input<string>('');
  subtitle = input<string | undefined>(undefined);
  error = input<string | null>(null);
}

