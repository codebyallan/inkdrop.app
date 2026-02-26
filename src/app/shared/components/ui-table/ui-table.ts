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

  action = output<{ type: string; row: any }>();

  emitAction(type: string, row: any) {
    this.action.emit({ type, row });
  }
}

