import { Component, EventEmitter, Output, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { IToner } from '../../types';

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
  templateUrl: './toner-card.html',
  styleUrl: './toner-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TonerCard {
  @Input({ required: true }) toner!: IToner;
  @Output() edit = new EventEmitter<IToner>();
  @Output() delete = new EventEmitter<IToner>();
  
  public authService = inject(AuthService);

  getTonerColor(color: string): string {
    if (!color) return '#cccccc';
    
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
    
    return colors[normalizedColor] || '#cccccc';
  }

  getTonerTextColor(color: string): string {
    if (!color) return '#000000';
    const normalizedColor = color.toLowerCase().trim();
    return (normalizedColor === 'black' || normalizedColor === 'preto') ? '#ffffff' : '#000000';
  }
}
