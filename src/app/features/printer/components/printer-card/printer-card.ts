import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { IPrinter, ITonerTelemetry } from '../../types';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-printer-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule, MatCardModule, TranslateModule],
  templateUrl: './printer-card.html',
  styleUrl: './printer-card.scss'
})
export class PrinterCard {
  @Input({ required: true }) printer!: IPrinter;
  @Output() edit = new EventEmitter<IPrinter>();
  @Output() delete = new EventEmitter<IPrinter>();

  public authService = inject(AuthService);

  public get filteredToners(): ITonerTelemetry[] {
    const toners = this.printer.telemetry?.toners?.filter(t => this.isToner(t.color)) || [];
    
    const colorOrder: Record<string, number> = {
      'black': 0, 'k': 0, 'bk': 0, 'preto': 0,
      'cyan': 1, 'c': 1, 'ciano': 1,
      'magenta': 2, 'm': 2,
      'yellow': 3, 'y': 3, 'amarelo': 3
    };

    return [...toners].sort((a, b) => {
      const colorA = a.color.trim().toLowerCase();
      const colorB = b.color.trim().toLowerCase();
      
      // Tenta encontrar o peso da cor. Se não encontrar, joga para o fim da lista.
      const weightA = colorOrder[colorA] ?? 
                      Object.keys(colorOrder).find(key => colorA.includes(key)) ? 
                      colorOrder[Object.keys(colorOrder).find(key => colorA.includes(key))!] : 99;
      
      const weightB = colorOrder[colorB] ?? 
                      Object.keys(colorOrder).find(key => colorB.includes(key)) ? 
                      colorOrder[Object.keys(colorOrder).find(key => colorB.includes(key))!] : 99;

      return weightA - weightB;
    });
  }

  isToner(color: string): boolean {
    const c = color?.trim().toLowerCase() || '';
    
    // 1. Filtro de Exclusão: Se contiver palavras de componentes técnicos, NÃO é toner
    const exclusions = ['revelador', 'tambor', 'drum', 'developer', 'recolha', 'waste', 'unidade', 'cilindro'];
    if (exclusions.some(term => c.includes(term))) {
      return false;
    }

    // 2. Filtro de Inclusão: Agora sim, verifica se é um toner de cor
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
    if (level < 10) return '#ef4444'; // Red for alert
    
    const c = color?.trim().toLowerCase() || '';

    if (c.includes('preto') || c.includes('black') || c.includes(' k ') || c.startsWith('k ') || c.endsWith(' k') || c === 'k' || c === 'bk') return '#000000';
    if (c.includes('ciano') || c.includes('cyan') || c.includes(' c ') || c.startsWith('c ') || c.endsWith(' c') || c === 'c') return '#00FFFF';
    if (c.includes('magenta') || c.includes(' m ') || c.startsWith('m ') || c.endsWith(' m') || c === 'm') return '#FF00FF';
    if (c.includes('amarelo') || c.includes('yellow') || c.includes(' y ') || c.startsWith('y ') || c.endsWith(' y') || c === 'y') return '#FFFF00';
    
    return '#cccccc';
  }


  getStatusClass(status: string | undefined): string {
    return status === 'Online' ? 'status-online' : 'status-offline';
  }
}
