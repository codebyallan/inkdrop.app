import { Component, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { ILocation } from '../../../../types/location.type';

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
  templateUrl: './location-card.component.html',
  styleUrl: './location-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationCard {
  location = input.required<ILocation>();
  edit = output<ILocation>();
  delete = output<ILocation>();
  
  public authService = inject(AuthService);
}
