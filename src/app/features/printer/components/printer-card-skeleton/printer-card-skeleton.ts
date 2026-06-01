import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-printer-card-skeleton',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './printer-card-skeleton.html',
  styleUrl: './printer-card-skeleton.scss'
})
export class PrinterCardSkeleton {}
