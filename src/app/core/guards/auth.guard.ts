import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * authGuard - protegge le route che richiedono utente loggato (Bonus B).
 *
 * Sintassi moderna FUNZIONALE: `CanActivateFn` e' semplicemente una
 * funzione che riceve `route` e `state` (il RouterStateSnapshot) e
 * ritorna boolean, UrlTree, o Observable di uno dei due.
 *
 * Se l'utente non e' loggato:
 *  - calcoliamo l'URL richiesto (`state.url`)
 *  - reindirizziamo a `/login` passandolo come `returnUrl` in query string
 *  - cosi dopo il login il LoginComponent puo' riportare l'utente
 *    esattamente dove aveva chiesto di andare.
 *
 * Si applica con `canActivate: [authGuard]` nella definizione della route.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  // Ritorniamo una UrlTree: piu pulito di chiamare router.navigate +
  // ritornare false. Angular gestisce direttamente il redirect.
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
