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
}
