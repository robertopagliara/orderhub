import { Routes } from '@angular/router';

/**
 * Rotte della feature "customers" (CORE — slide "Resto dell'app").
 *  - ''   → CustomerListComponent
 *  - ':id'→ CustomerDetailComponent (con storico ordini del cliente)
 */
export const CUSTOMERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./customer-list.component').then((m) => m.CustomerListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./customer-detail.component').then(
        (m) => m.CustomerDetailComponent,
      ),
  },
];
