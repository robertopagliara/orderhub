import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Customer } from '../models/customer.model';

/**
 * CustomerService - accesso ai customer del backend mock (Sprint 2).
 *
 * Per ora espone solo i metodi utili al dettaglio ordine:
 *  - `getAll()` ritorna l'elenco completo (servira anche nel form di
 *    Sprint 3 come sorgente del select cliente)
 *  - `getById(id)` ritorna il cliente associato a un ordine
 *
 * `providedIn: 'root'` rende il service singleton applicativo: nessun
 * NgModule, dipendenze risolte con `inject()`.
 */
@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/customers';

  /**
   * Recupera l'elenco completo dei clienti.
   *
   * @returns Observable<Customer[]> che emette una volta e completa.
   */
  getAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.baseUrl);
  }

  /**
   * Recupera un singolo cliente per id.
   *
   * @param id - Identificatore del cliente (stringa per coerenza con json-server).
   * @returns Observable<Customer> con il customer o errore HTTP 404.
   */
  getById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crea un nuovo cliente (POST).
   *
   * L'id viene generato dal chiamante con `crypto.randomUUID()` per
   * restare type-safe sul `string` del modello, indipendente dal
   * comportamento di json-server (che altrimenti assegnerebbe un
   * id numerico).
   */
  create(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, customer);
  }

  /**
   * Sostituisce un cliente esistente (PUT).
   * Richiede l'oggetto Customer completo.
   */
  update(customer: Customer): Observable<Customer> {
    return this.http.put<Customer>(
      `${this.baseUrl}/${customer.id}`,
      customer,
    );
  }

  /**
   * Elimina un cliente per id (DELETE).
   *
   * NB didattica: json-server non ha integrità referenziale. Gli ordini
   * con `customerId` puntante a un cliente eliminato restano nel db
   * con un puntatore "orfano". In un backend reale si gestirebbe con
   * un vincolo FK o un soft-delete.
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
