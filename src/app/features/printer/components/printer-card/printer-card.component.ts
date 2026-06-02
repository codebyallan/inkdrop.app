import { Component, input, output, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { IPrinter, ITonerTelemetry } from '../../../../types/printer.type';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-printer-card',
  standalone: true,
  imports: [DatePipe, UpperCasePipe, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule, MatCardModule, TranslateModule],
  templateUrl: './printer-card.component.html',
  styleUrl: './printer-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrinterCard {
  printer = input.required<IPrinter>();
  edit = output<IPrinter>();
  delete = output<IPrinter>();

  public authService = inject(AuthService);

  public filteredToners = computed(() => {
    const printer = this.printer();
    const toners = printer.telemetry?.toners?.filter((t: ITonerTelemetry) => this.isToner(t.color)) || [];
    
    const colorOrder: Record<string, number> = {
      'black': 0, 'k': 0, 'bk': 0, 'preto': 0,
      'cyan': 1, 'c': 1, 'ciano': 1,
      'magenta': 2, 'm': 2,
      'yellow': 3, 'y': 3, 'amarelo': 3
    };

    return [...toners].sort((a, b) => {
      const colorA = a.color.trim().toLowerCase();
      const colorB = b.color.trim().toLowerCase();
      
      const weightA = colorOrder[colorA] ?? 
                      Object.keys(colorOrder).find(key => colorA.includes(key)) ? 
                      colorOrder[Object.keys(colorOrder).find(key => colorA.includes(key))!] : 99;
      
      const weightB = colorOrder[colorB] ?? 
                      Object.keys(colorOrder).find(key => colorB.includes(key)) ? 
                      colorOrder[Object.keys(colorOrder).find(key => colorB.includes(key))!] : 99;

      return weightA - weightB;
    });
  });

  private isToner(color: string): boolean {
    const c = color?.trim().toLowerCase() || '';
    const exclusions = ['revelador', 'tambor', 'drum', 'developer', 'recolha', 'waste', 'unidade', 'cilindro'];
    if (exclusions.some(term => c.includes(term))) {
      return false;
    }
    return c.includes('preto') || c.includes('black') || 
           c.includes('ciano') || c.includes('cyan') || 
           c.includes('magenta') || 
           c.includes('amarelo') || c.includes('yellow') ||
           c === 'k' || c === 'c' || c === 'm' || c === 'y';
  }

  getTonerClass(color: string): string {
    switch (color?.trim().toLowerCase()) {
      case 'black': return 'toner-black';
      case 'cyan': return 'toner-cyan';
      case 'magenta': return 'toner-magenta';
      case 'yellow': return 'toner-yellow';
      default: return 'toner-default';
    }
  }

  getTonerColor(color: string, level: number): string {
    if (level < 10) return 'var(--mat-sys-error)';
    const c = color?.trim().toLowerCase() || '';
    if (c.includes('preto') || c.includes('black') || c.includes(' k ') || c.startsWith('k ') || c.endsWith(' k') || c === 'k' || c === 'bk') return '#000000';
    if (c.includes('ciano') || c.includes('cyan') || c.includes(' c ') || c.startsWith('c ') || c.endsWith(' c') || c === 'c') return '#00FFFF';
    if (c.includes('magenta') || c.includes(' m ') || c.startsWith('m ') || c.endsWith(' m') || c === 'm') return '#FF00FF';
    if (c.includes('amarelo') || c.includes('yellow') || c.includes(' y ') || c.startsWith('y ') || c.endsWith(' y') || c === 'y') return '#FFFF00';
    return 'var(--mat-sys-outline-variant)';
  }

  getStatusClass(status: string | undefined): string {
    return status === 'Online' ? 'status-online' : 'status-offline';
  }
}
