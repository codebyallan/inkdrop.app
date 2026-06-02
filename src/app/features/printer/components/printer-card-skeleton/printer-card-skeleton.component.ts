import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-printer-card-skeleton',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './printer-card-skeleton.component.html',
  styleUrl: './printer-card-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrinterCardSkeleton {}
