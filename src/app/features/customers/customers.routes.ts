import { Routes } from '@angular/router';

/**
 * Rotte della feature "customers" (CORE + Bonus C — CRUD).
 *  - ''         → CustomerListComponent
 *  - 'new'      → CustomerFormComponent (create)
 *  - ':id/edit' → CustomerFormComponent (edit)
 *  - ':id'      → CustomerDetailComponent
 *
 * ATTENZIONE all'ordine: 'new' e ':id/edit' DEVONO precedere ':id',
 * altrimenti il matcher Angular interpreterebbe 'new' come un id.
 */
export const CUSTOMERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./customer-list.component').then((m) => m.CustomerListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./customer-form.component').then((m) => m.CustomerFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./customer-form.component').then((m) => m.CustomerFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./customer-detail.component').then(
        (m) => m.CustomerDetailComponent,
      ),
  },
];
