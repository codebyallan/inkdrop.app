import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout';
import { UiTableComponent } from '../../shared/components/ui-table/ui-table';
import { MovementsService } from './services/movement-service';
import { IMovement } from './types';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MovementForm } from './components/movement-form/movement-form';
import { TonersService } from '../toner/services/toner-service';
import { PrintersService } from '../printer/services/printer-service';
import { IToner } from '../toner/types';
import { IPrinter } from '../printer/types';

@Component({
  selector: 'app-movement',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, PageLayoutComponent, UiTableComponent, MatDialogModule],
  templateUrl: './movement.html',
  styleUrl: './movement.scss',
})
export class Movement implements OnInit {
  private movementsService = inject(MovementsService);
  private tonersService = inject(TonersService);
  private printersService = inject(PrintersService);
  private _snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  movements = signal<IMovement[]>([]);
  private tonersMap = new Map<string, string>();
  private printersMap = new Map<string, string>();

  columnsConfig = [
    { id: 'tonerModel', header: 'Toner', field: 'tonerModel', type: 'text' as const },
    { id: 'printerName', header: 'Printer', field: 'printerName', type: 'text' as const },
    { id: 'quantity', header: 'Quantity', field: 'quantity', type: 'text' as const },
    { id: 'type', header: 'Type', field: 'type', type: 'text' as const },
    { id: 'description', header: 'Description', field: 'description', type: 'text' as const },
    { id: 'createdAt', header: 'Created At', field: 'createdAt', type: 'date' as const, dateFormat: 'dd/MM/yyyy' }
  ];

  ngOnInit() {
    this.tonersService.getToners().subscribe({
      next: (toners: IToner[]) => {
        this.tonersMap = new Map(toners.map(t => [t.id, `${t.model} - ${t.color}`]));
        this.applyNames();
      },
      error: () => this.showAlert('Error fetching toners', 'Close')
    });
    this.printersService.getPrinters().subscribe({
      next: (printers: IPrinter[]) => {
        this.printersMap = new Map(printers.map(p => [p.id, p.name]));
        this.applyNames();
      },
      error: () => this.showAlert('Error fetching printers', 'Close')
    });
    this.movementsService.getMovements().subscribe({
      next: (data) => {
        this.movements.set(data);
        this.applyNames();
      },
      error: () => this.showAlert('Error fetching movements', 'Close')
    });
  }

  openDialog() {
    const toners = Array.from(this.tonersMap.entries()).map(([id, label]) => ({ id, label }));
    const printers = Array.from(this.printersMap.entries()).map(([id, name]) => ({ id, name }));
    const ref = this.dialog.open(MovementForm, { width: '560px', data: { toners, printers } });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.movementsService.createMovement(result).subscribe({
          next: () => {
            this.movementsService.getMovements().subscribe({
              next: (data) => {
                this.movements.set(data);
                this.applyNames();
                this.showAlert('Movement created successfully', 'Close');
              },
              error: () => this.showAlert('Error refreshing movements list', 'Close')
            });
          },
          error: (err) => {
            let errorMessage = 'Error creating movement';
            if (err?.status === 400 && err?.error?.errors && err.error.errors[0]?.message) {
              errorMessage = err.error.errors[0].message;
            }
            this.showAlert(errorMessage, 'Close');
          }
        });
      }
    });
  }

  private applyNames() {
    const tonersMap = this.tonersMap;
    const printersMap = this.printersMap;
    this.movements.update(list => list.map(m => ({
      ...m,
      tonerModel: tonersMap.get(m.tonerId) || m.tonerModel || '',
      printerName: m.printerId ? (printersMap.get(m.printerId) || m.printerName || '') : ''
    })));
  }

  showAlert(msg: string, action: string) {
    this._snackBar.open(msg, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}

