import { Component, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { IToner } from '../../../../types/toner.type';

@Component({
  selector: 'app-toner-card',
  standalone: true,
  imports: [
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule, 
    TranslateModule, 
    DatePipe
  ],
  templateUrl: './toner-card.component.html',
  styleUrl: './toner-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TonerCard {
  toner = input.required<IToner>();
  edit = output<IToner>();
  delete = output<IToner>();
  
  public authService = inject(AuthService);

  getTonerColor(color: string): string {
    if (!color) return 'var(--mat-sys-outline-variant)';
    const normalizedColor = color.toLowerCase().trim();
    const colors: Record<string, string> = {
      'black': '#000000',
      'preto': '#000000',
      'cyan': '#00ffff',
      'ciano': '#00ffff',
      'magenta': '#ff00ff',
      'yellow': '#ffff00',
      'amarelo': '#ffff00',
    };
    return colors[normalizedColor] || 'var(--mat-sys-outline-variant)';
  }

  getTonerTextColor(color: string): string {
    if (!color) return 'var(--mat-sys-on-surface)';
    const normalizedColor = color.toLowerCase().trim();
    return (normalizedColor === 'black' || normalizedColor === 'preto') ? 'white' : 'black';
  }
}
