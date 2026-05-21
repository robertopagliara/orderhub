import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

/**
 * Routing principale dell'applicazione OrderHub.
 *
 * Aree feature lazy loaded, tutte protette da `authGuard` tranne
 * la pagina di login. Senza utente loggato il guard reindirizza a
 * `/login` con `returnUrl` valorizzato.
 *
 *  - orders    -> Sprint 1/2/3 (protetta)
 *  - products  -> Core "Resto dell'app" (protetta)
 *  - customers -> Core "Resto dell'app" (protetta)
 *  - auth      -> Bonus B (login, NON protetta)
 *
 * '' redirect a 'orders'. Se non loggato, il guard intercetta la
 * navigazione e porta a `/login`. ** wildcard riporta a 'orders'
 * (potrebbe essere una NotFoundComponent in una versione completa).
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'orders' },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/orders/orders.routes').then((m) => m.ORDERS_ROUTES),
  },
  {
    path: 'products',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/products/products.routes').then(
        (m) => m.PRODUCTS_ROUTES,
      ),
  },
  {
    path: 'customers',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/customers/customers.routes').then(
        (m) => m.CUSTOMERS_ROUTES,
      ),
  },
  {
    // Bonus B: feature auth con la pagina di login (NON protetta).
    path: '',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: 'orders' },
];
