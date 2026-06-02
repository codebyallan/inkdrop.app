import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-location-card-skeleton',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './location-card-skeleton.component.html',
  styleUrl: './location-card-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationCardSkeleton {}
