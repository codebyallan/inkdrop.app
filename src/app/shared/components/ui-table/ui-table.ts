import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-ui-table',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './ui-table.html',
  styleUrl: './ui-table.scss',
})
export class UiTableComponent {
  data = input<any[]>([]);
  columns = input<Array<{ id: string; header?: string; field?: string; type?: 'text' | 'date' | 'actions'; dateFormat?: string }>>([]);
  columnIds = computed(() => this.columns().map(c => c.id));
  loading = input<boolean>(false);
  skeletonRows = input<number>(5);
  skeletonRowsArray = computed(() => Array.from({ length: Math.max(1, this.skeletonRows() || 0) }, (_, i) => i));
  colCount = computed(() => this.columns().length || 1);
  gridTemplate = computed(() => {
    const cols = this.columns();
    if (!cols?.length) return '';
    const mapWidth = (c: { id: string; type?: 'text' | 'date' | 'actions' }) => {
      if (c.type === 'actions') return '96px';
      if (c.type === 'date' || /date|createdat/i.test(c.id)) return '128px';
      return 'minmax(160px, 1fr)';
    };
    return cols.map(mapWidth).join(' ');
  });

  action = output<{ type: string; row: any }>();

  emitAction(type: string, row: any) {
    this.action.emit({ type, row });
  }
}

