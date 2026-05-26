import { Injectable, inject, Injector } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root',
})
export class ErrorNotificationService {
  private snackBar = inject(MatSnackBar);
  private injector = inject(Injector);

  showError(message: string, panelClass: string = 'error-snackbar') {
    const translation = this.injector.get(TranslationService);
    
    this.snackBar.open(
      translation.instant(message),
      translation.instant('shared.actions.close'),
      { 
        duration: 5000, 
        horizontalPosition: 'right', 
        verticalPosition: 'bottom', 
        panelClass 
      }
    );
  }
}
