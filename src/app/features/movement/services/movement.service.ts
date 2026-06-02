import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IMovement, IMovementDisplay } from '../../../types/movement.type';
import { tap, take } from 'rxjs/operators';
import { CacheEventService } from '../../../core/services/cache-event.service';
import { TonersService } from '../../toner/services/toner.service';
import { PrintersService } from '../../printer/services/printer.service';
import { LocationsService } from '../../location/services/location.service';

@Injectable({
  providedIn: 'root',
})
export class MovementsService {
  private http = inject(HttpClient);
  private cacheEvent = inject(CacheEventService);
  private tonersService = inject(TonersService);
  private printersService = inject(PrintersService);
  private locationsService = inject(LocationsService);
  private API_URL = `${environment.BASE_URL}/movements`;

  private _movements = signal<IMovement[]>([]);
  private _loaded = signal(false);
  public readonly movements = this._movements.asReadonly();
  public readonly isLoaded = this._loaded.asReadonly();

  public readonly movementsDisplay = computed(() => {
    const list = this._movements();
    const toners = this.tonersService.toners();
    const printers = this.printersService.printers();
    const locations = this.locationsService.locations();

    const tonersMap = new Map(toners.map(t => [t.id, `${t.model} - ${t.color}`]));
    const printersMap = new Map(printers.map(p => [p.id, { name: p.name, locationId: p.locationId }]));
    const locationsMap = new Map(locations.map(l => [l.id, l.name]));

    return list.map(m => {
      const printer = m.printerId ? printersMap.get(m.printerId) : null;
      const locationName = printer ? locationsMap.get(printer.locationId) : '';
      const printerDisplay = printer 
        ? `${printer.name} - ${locationName || 'No Location'}` 
        : (m.printerName || '');

      return {
        ...m,
        tonerModel: m.tonerId ? (tonersMap.get(m.tonerId) || m.tonerModel || '') : (m.tonerModel || ''),
        printerName: printerDisplay
      } as IMovementDisplay;
    });
  });

  getMovements(forceRefresh = false): Observable<IMovement[]> {
    const hasCache = this._loaded();

    if (!forceRefresh && hasCache) {
      this.http.get<IMovement[]>(this.API_URL).pipe(
        tap(data => {
          this._movements.set(data);
          this._loaded.set(true);
        }),
        take(1)
      ).subscribe({ error: err => console.error('Background refresh movements failed:', err) });

      return of(this._movements());
    }

    return this.http.get<IMovement[]>(this.API_URL).pipe(
      tap(data => {
        this._movements.set(data);
        this._loaded.set(true);
      })
    );
  }
  createMovement(payload: Partial<IMovement>): Observable<IMovement> {
    return this.http.post<IMovement>(this.API_URL, payload).pipe(
      tap(created => {
        this._movements.update(prev => [...prev, created]);
        this.cacheEvent.broadcast('movement');
      })
    );
  }
}

