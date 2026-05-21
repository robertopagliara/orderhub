import { Routes } from '@angular/router';

/**
 * Routing principale dell'applicazione OrderHub.
 *
 * Sprint 0: scheletro con tre aree feature caricate in lazy loading.
 * Le rotte interne di ciascuna feature saranno definite negli sprint successivi.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'orders' },
  {
    path: 'orders',
    loadChildren: () =>
      import('./features/orders/orders.routes').then((m) => m.ORDERS_ROUTES),
  },
  {
    path: 'products',
    loadChildren: () =>
      import('./features/products/products.routes').then(
        (m) => m.PRODUCTS_ROUTES,
      ),
  },
  {
    path: 'customers',
    loadChildren: () =>
      import('./features/customers/customers.routes').then(
        (m) => m.CUSTOMERS_ROUTES,
      ),
  },
  { path: '**', redirectTo: 'orders' },
];
