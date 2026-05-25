import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Product } from '../models/product.model';

/**
 * ProductService - accesso al catalogo prodotti del backend mock.
 *
 * Usato dal form ordine per popolare il dropdown di selezione prodotto
 * nelle righe del FormArray. Stesso pattern di CustomerService.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/products';

  /**
   * Recupera l'elenco completo dei prodotti a catalogo.
   */
  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }

  /**
   * Recupera un singolo prodotto per id.
   */
  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crea un nuovo prodotto (POST).
   * Id generato dal chiamante con `crypto.randomUUID()` per restare
   * type-safe sul `string` del modello.
   */
  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product);
  }

  /** Sostituisce un prodotto esistente (PUT). */
  update(product: Product): Observable<Product> {
    return this.http.put<Product>(
      `${this.baseUrl}/${product.id}`,
      product,
    );
  }

  /**
   * Elimina un prodotto per id (DELETE).
   *
   * NB didattica: gli OrderItem hanno name/price denormalizzati al
   * momento dell'acquisto, quindi gli ordini storici restano coerenti
   * anche se il prodotto sparisce dal catalogo. Resta orfano solo il
   * `productId` di OrderItem (che diventa un puntatore "morto").
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
