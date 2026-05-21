import { Routes } from '@angular/router';

/**
 * Rotte della feature "orders".
 *
 * - Sprint 1: '' -> OrderListComponent (lista)
 * - Sprint 2: ':id' -> OrderDetailComponent (dettaglio)
 *
 * Ogni rotta usa `loadComponent` per code-splitting fine-grained:
 * il chunk del componente viene scaricato solo quando l'utente
 * naviga su quella specifica rotta.
 */
export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./order-list.component').then((m) => m.OrderListComponent),
    title: 'OrderHub - Lista ordini',
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
