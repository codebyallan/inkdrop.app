import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logo {

}
