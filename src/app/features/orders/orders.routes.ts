import { Routes } from '@angular/router';

/**
 * Rotte della feature "orders".
 *
 * - Sprint 1: ''         -> OrderListComponent   (lista)
 * - Sprint 2: ':id'      -> OrderDetailComponent (dettaglio)
 * - Sprint 3: 'new'      -> OrderFormComponent   (creazione)
 * - Sprint 3: ':id/edit' -> OrderFormComponent   (modifica)
 *
 * IMPORTANTE: 'new' viene PRIMA di ':id' altrimenti il router penserebbe
 * che 'new' sia un id valido. Anche ':id/edit' DEVE stare prima di
 * ':id', perche' i path piu' specifici vincono in ordine di matching.
 *
 * Ogni rotta usa `loadComponent` per code-splitting fine-grained.
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
    loadComponent: () =>
      import('./order-form.component').then((m) => m.OrderFormComponent),
    title: 'OrderHub - Nuovo ordine',
  },
  {
    path: ':id/edit',
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
