import { Routes } from '@angular/router';

/**
 * Rotte della feature "products" (CORE — slide "Resto dell'app").
 *  - ''   → ProductListComponent
 *  - ':id'→ ProductDetailComponent
 *
 * Entrambi caricati in lazy loading dal routing root.
 */
export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./product-list.component').then((m) => m.ProductListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./product-detail.component').then(
        (m) => m.ProductDetailComponent,
      ),
  },
];
