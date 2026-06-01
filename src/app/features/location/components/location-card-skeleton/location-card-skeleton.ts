import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-location-card-skeleton',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './location-card-skeleton.html',
  styleUrl: './location-card-skeleton.scss'
})
export class LocationCardSkeleton {}
