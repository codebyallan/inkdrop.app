import { Component, EventEmitter, Output, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { ILocation } from '../../types';

@Component({
  selector: 'app-location-card',
  standalone: true,
  imports: [
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule, 
    TranslateModule, 
    DatePipe
  ],
  templateUrl: './location-card.html',
  styleUrl: './location-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationCard {
  @Input({ required: true }) location!: ILocation;
  @Output() edit = new EventEmitter<ILocation>();
  @Output() delete = new EventEmitter<ILocation>();
  
  public authService = inject(AuthService);
}
