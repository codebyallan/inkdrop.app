import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-toner-card-skeleton',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './toner-card-skeleton.component.html',
  styleUrl: './toner-card-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TonerCardSkeleton {}
