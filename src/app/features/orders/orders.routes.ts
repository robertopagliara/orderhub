import { Routes } from '@angular/router';

/**
 * Rotte della feature "orders".
 *
 * Sprint 1: '' -> OrderListComponent (lista + filtro per status).
 * Sprint 2 aggiungera ':id' -> OrderDetailComponent.
 *
 * `loadComponent` permette il code-splitting fine-grained: il chunk
 * del componente viene scaricato solo quando l'utente naviga su
 * questa specifica rotta.
 */
export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./order-list.component').then((m) => m.OrderListComponent),
    title: 'OrderHub - Lista ordini',
  },
];
