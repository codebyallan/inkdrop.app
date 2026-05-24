import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type CacheEntity = 'toner' | 'printer' | 'location' | 'movement' | 'user';

@Injectable({
  providedIn: 'root'
})
export class CacheEventService {
  private eventSubject = new Subject<CacheEntity>();
  
  /**
   * Observable that other services can subscribe to
   */
  public events$ = this.eventSubject.asObservable();

  /**
   * Broadcasts that a specific entity has been modified
   */
  broadcast(entity: CacheEntity): void {
    this.eventSubject.next(entity);
  }
}
