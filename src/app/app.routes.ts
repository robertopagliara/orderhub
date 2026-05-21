import { Routes } from '@angular/router';

/**
 * Routing principale dell'applicazione OrderHub.
 *
 * Aree feature lazy loaded:
 *  - orders    -> Sprint 1/2/3
 *  - products  -> placeholder (a casa, bonus C)
 *  - customers -> placeholder (a casa, bonus C)
 *  - auth      -> Bonus B (login)
 *
 * '' redirect a 'orders'. ** wildcard riporta a 'orders' (potrebbe
 * essere una NotFoundComponent in una versione completa).
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
  {
    // Bonus B: feature auth con la pagina di login.
    path: '',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: 'orders' },
];
