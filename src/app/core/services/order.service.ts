import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Order } from '../models/order.model';

/**
 * Service responsabile dell'accesso alle API degli ordini.
 *
 * `providedIn: 'root'` → singleton applicativo, registrato automaticamente
 * dall'injector radice (no NgModule).
 *
 * Pattern moderno Angular 21: niente constructor, dipendenze risolte con `inject()`.
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/orders';

  /** Restituisce la lista completa degli ordini. */
  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.baseUrl);
  }

  /** Restituisce il dettaglio di un singolo ordine. */
  getById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }
}
