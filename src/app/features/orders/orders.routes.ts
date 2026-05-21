import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

/**
 * Rotte della feature "orders".
 *
 * - Sprint 1: ''         -> OrderListComponent   (lista)
 * - Sprint 2: ':id'      -> OrderDetailComponent (dettaglio)
 * - Sprint 3: 'new'      -> OrderFormComponent   (creazione, PROTETTA)
 * - Sprint 3: ':id/edit' -> OrderFormComponent   (modifica, PROTETTA)
 *
 * IMPORTANTE per il matching:
 *  - 'new' viene PRIMA di ':id' (altrimenti il router penserebbe che
 *    'new' sia un id valido).
 *  - ':id/edit' viene PRIMA di ':id' (path piu' specifici vincono).
 *
 * Le route di modifica sono protette da `authGuard` (Bonus B): se
 * l'utente non e' loggato, viene reindirizzato a /login con `returnUrl`.
 *
 * `loadComponent` permette code-splitting fine-grained.
 */
export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./order-list.component').then((m) => m.OrderListComponent),
    title: 'OrderHub - Lista ordini',
  },
  {
    path: 'new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./order-form.component').then((m) => m.OrderFormComponent),
    title: 'OrderHub - Nuovo ordine',
  },
  {
    path: ':id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./order-form.component').then((m) => m.OrderFormComponent),
    title: 'OrderHub - Modifica ordine',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./order-detail.component').then(
        (m) => m.OrderDetailComponent,
      ),
    title: 'OrderHub - Dettaglio ordine',
  },
];
