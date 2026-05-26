import { Component, inject, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

export interface ColumnDef<T = Record<string, unknown>> {
  id: string;
  header?: string;
  field?: string;
  type?: 'text' | 'date' | 'actions' | 'badge' | 'icon';
  dateFormat?: string;
  /** For type='text' | 'icon': returns the displayed value (text or icon name). */
  transform?: (value: unknown, row: T) => string | number;
  /** For type='icon': returns the CSS color of the icon (e.g., '#2e7d32'). */
  colorTransform?: (value: unknown, row: T) => string;
  /** For type='icon': tooltip text on mouse hover. */
  tooltipTransform?: (value: unknown, row: T) => string;
}

@Component({
  selector: 'app-ui-table',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, DatePipe, TranslateModule],
  templateUrl: './ui-table.html',
  styleUrl: './ui-table.scss',
})
export class UiTableComponent {
  private authService = inject(AuthService);
  protected currentUserId = computed(() => this.authService.currentUser()?.id);

  data = input<any[]>([]);
  columns = input<ColumnDef<any>[]>([]);
  showToggle = input<boolean>(false);
  columnIds = computed(() => this.columns().map(c => c.id));
  loading = input<boolean>(false);
  skeletonRows = input<number>(5);
  skeletonRowsArray = computed(() =>
    Array.from({ length: Math.max(1, this.skeletonRows() || 0) }, (_, i) => i)
  );
  colCount = computed(() => this.columns().length || 1);
  gridTemplate = computed(() => {
    const cols = this.columns();
    if (!cols?.length) return '';
    const mapWidth = (c: ColumnDef<any>) => {
      if (c.type === 'actions') return '96px';
      if (c.type === 'icon')   return '56px';
      if (c.type === 'date' || c.type === 'badge' || /date|createdat/i.test(c.id)) return '128px';
      return 'minmax(0, 1fr)';
    };
    return cols.map(mapWidth).join(' ');
  });

  action = output<{ type: string; row: any }>();

  get isAdmin() {
    return this.authService.isAdmin();
  }

  emitAction(type: string, row: any) {
    this.action.emit({ type, row });
  }
}
