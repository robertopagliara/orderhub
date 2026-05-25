import { Routes } from '@angular/router';

/**
 * Rotte della feature "products" (CORE + Bonus D — CRUD).
 *  - ''         → ProductListComponent
 *  - 'new'      → ProductFormComponent (create)
 *  - ':id/edit' → ProductFormComponent (edit)
 *  - ':id'      → ProductDetailComponent
 *
 * ATTENZIONE all'ordine: 'new' e ':id/edit' DEVONO precedere ':id',
 * altrimenti il matcher Angular interpreterebbe 'new' come un id.
 */
export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./product-list.component').then((m) => m.ProductListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./product-form.component').then((m) => m.ProductFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./product-form.component').then((m) => m.ProductFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./product-detail.component').then(
        (m) => m.ProductDetailComponent,
      ),
  },
];
