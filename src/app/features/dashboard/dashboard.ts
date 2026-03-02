import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TonersService } from '../toner/services/toner-service';
import { PrintersService } from '../printer/services/printer-service';
import { MovementsService } from '../movement/services/movement-service';
import { MovementForm } from '../movement/components/movement-form/movement-form';
import { UiTableComponent } from '../../shared/components/ui-table/ui-table';
import { IToner } from '../toner/types';
import { IPrinter } from '../printer/types';
import { IMovement } from '../movement/types';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatButtonModule, MatSnackBarModule, MatDialogModule, UiTableComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private tonersService = inject(TonersService);
  private printersService = inject(PrintersService);
  private movementsService = inject(MovementsService);
  private _snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  toners = signal<IToner[]>([]);
  lowToners = signal<IToner[]>([]);
  printers = signal<IPrinter[]>([]);
  movements = signal<IMovement[]>([]);
  private pending = signal<number>(0);
  loading = computed(() => this.pending() > 0);

  tonersInStock = computed(() =>
    this.toners().reduce((sum, t) => sum + (t.quantity ?? 0), 0)
  );
  lowTonersCount = computed(() => this.lowToners().length);
  activePrintersCount = computed(() => this.printers().length);
  movementsToday = computed(() => {
    const today = new Date().toDateString();
    return this.movements().filter(
      (m) => new Date(m.createdAt).toDateString() === today
    ).length;
  });

  movementsWithNames = computed(() => {
    const list = this.movements();
    const tonersMap = new Map(this.toners().map((t) => [t.id, `${t.model} - ${t.color}`]));
    const printersMap = new Map(this.printers().map((p) => [p.id, p.name]));
    return list.map((m) => ({
      ...m,
      tonerModel: tonersMap.get(m.tonerId) ?? m.tonerModel ?? '',
      printerName: m.printerId ? (printersMap.get(m.printerId) ?? m.printerName ?? '') : '',
    }));
  });

  recentMovements = computed(() => {
    const withNames = this.movementsWithNames();
    return [...withNames]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  });

  recentMovementsColumns = [
    { id: 'createdAt', header: 'Date', field: 'createdAt', type: 'date' as const, dateFormat: 'dd/MM/yyyy' },
    { id: 'printerName', header: 'Printer', field: 'printerName', type: 'text' as const },
    { id: 'type', header: 'Type', field: 'type', type: 'text' as const },
    { id: 'tonerModel', header: 'Toner', field: 'tonerModel', type: 'text' as const },
    { id: 'quantity', header: 'Quantity', field: 'quantity', type: 'text' as const },
  ];

  private readonly lowStockThreshold = 3;

  ngOnInit() {
    const start = () => this.pending.update(n => n + 1);
    const done = () => this.pending.update(n => Math.max(0, n - 1));

    start();
    this.tonersService.getToners().subscribe({
      next: (data) => {
        this.toners.set(data);
        done();
      },
      error: () => {
        done();
        this.showAlert('Error fetching toners', 'Close');
      },
    });

    start();
    this.tonersService.getLowStock(this.lowStockThreshold).subscribe({
      next: (data) => {
        this.lowToners.set(data);
        done();
      },
      error: () => {
        done();
        this.showAlert('Error fetching low stock toners', 'Close');
      },
    });

    start();
    this.printersService.getPrinters().subscribe({
      next: (data) => {
        this.printers.set(data);
        done();
      },
      error: () => {
        done();
        this.showAlert('Error fetching printers', 'Close');
      },
    });

    start();
    this.movementsService.getMovements().subscribe({
      next: (data) => {
        this.movements.set(data);
        done();
      },
      error: () => {
        done();
        this.showAlert('Error fetching movements', 'Close');
      },
    });
  }

  openNewMovement() {
    const toners = this.toners().map((t) => ({
      id: t.id,
      label: `${t.model} - ${t.color}`,
    }));
    const printers = this.printers().map((p) => ({ id: p.id, name: p.name }));
    const ref = this.dialog.open(MovementForm, {
      width: '560px',
      data: { toners, printers },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.movementsService.createMovement(result).subscribe({
          next: () => {
            this.movementsService.getMovements().subscribe({
              next: (data) => {
                this.movements.set(data);
                this.showAlert('Movement created successfully', 'Close');
              },
              error: () =>
                this.showAlert('Error refreshing movements list', 'Close'),
            });
          },
          error: (err) => {
            const errorMessage =
              err?.status === 400 && err?.error?.errors?.[0]?.message
                ? err.error.errors[0].message
                : 'Error creating movement';
            this.showAlert(errorMessage, 'Close');
          },
        });
      }
    });
  }

  goToHistory() {
    this.router.navigate(['/movements']);
  }

  private showAlert(msg: string, action: string) {
    this._snackBar.open(msg, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}
