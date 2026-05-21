import { Routes } from '@angular/router';

/**
 * Rotte della feature "auth" (Bonus B).
 *
 * Per ora una sola rotta:
 *  - 'login' -> LoginComponent
 *
 * Lazy loaded da app.routes.ts.
 */
export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login.component').then((m) => m.LoginComponent),
    title: 'OrderHub - Accedi',
  },
];
