import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-card-skeleton',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './user-card-skeleton.component.html',
  styleUrl: './user-card-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardSkeleton {}
