import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Order } from '../models/order.model';

/**
 * OrderService - accesso CRUD agli ordini (Sprint 1 + 3).
 *
 * `providedIn: 'root'` → singleton applicativo, registrato dall'injector
 * radice. Niente NgModule, niente boilerplate.
 *
 * Pattern moderno Angular 21: nessun constructor, le dipendenze vengono
 * risolte con la funzione `inject()`.
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

  /**
   * Crea un nuovo ordine. L'id e il timestamp `createdAt` vengono
   * generati dal chiamante (OrderFormComponent) per restare type-safe
   * sul tipo `string` dell'id, indipendente dal comportamento di
   * json-server (che altrimenti assegnerebbe un id numerico).
   *
   * @param order - Order completo (con id e createdAt gia valorizzati).
   * @returns Observable<Order> con la risorsa salvata sul backend.
   */
  create(order: Order): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, order);
  }

  /**
   * Sostituisce un ordine esistente (PUT).
   * Richiede l'oggetto Order completo, inclusi i campi non modificati.
   *
   * @param order - Order aggiornato; deve avere `id` valorizzato.
   * @returns Observable<Order> con la risorsa aggiornata.
   */
  update(order: Order): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/${order.id}`, order);
  }

  /**
   * Elimina un ordine per id.
   *
   * @param id - Identificatore dell'ordine da rimuovere.
   * @returns Observable<void> che completa al successo della DELETE.
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
