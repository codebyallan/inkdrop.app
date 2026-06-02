import { Component, inject, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

import { ColumnDef } from '../../../types/ui-table.type';

@Component({
  selector: 'app-ui-table',
  standalone: true,
  imports: [NgClass, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, DatePipe, TranslateModule],
  templateUrl: './ui-table.component.html',
  styleUrl: './ui-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTableComponent<T = unknown> {
  private authService = inject(AuthService);
  protected currentUserId = computed(() => this.authService.currentUser()?.id);

  data = input<T[]>([]);
  columns = input<ColumnDef<T>[]>([]);
  showToggle = input<boolean>(false);
  loading = input<boolean>(false);
  error = input<string | null>(null);
  emptyState = input<{ title: string; subtitle: string } | null>(null);
  retry = output<void>();
  skeletonRows = input<number>(5);
  columnIds = computed(() => this.columns().map(c => c.id));
  skeletonRowsArray = computed(() =>
    Array.from({ length: Math.max(1, this.skeletonRows() || 0) }, (_, i) => i)
  );
  colCount = computed(() => this.columns().length || 1);
  gridTemplate = computed(() => {
    const cols = this.columns();
    if (!cols?.length) return '';
    const mapWidth = (c: ColumnDef<T>) => {
      if (c.type === 'actions') return '96px';
      if (c.type === 'icon')   return '56px';
      if (c.type === 'date' || c.type === 'badge' || /date|createdat/i.test(c.id)) return '128px';
      return 'minmax(0, 1fr)';
    };
    return cols.map(mapWidth).join(' ');
  });

  action = output<{ type: string; row: T }>();

  get isAdmin() {
    return this.authService.isAdmin();
  }

  emitAction(type: string, row: T) {
    this.action.emit({ type, row });
  }

  onRetry() {
    this.retry.emit();
  }
}
