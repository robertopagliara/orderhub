import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ToastService } from '../services/toast.service';

/**
 * errorInterceptor - converte gli errori HTTP in toast utente (Bonus A).
 *
 * Mappa lo status code in un messaggio human-readable:
 *  - 0:   server irraggiungibile (CORS, offline, json-server spento)
 *  - 401: sessione scaduta -> in app reale qui andrebbe il redirect a login
 *  - 403: permesso negato
 *  - 404: risorsa non trovata
 *  - 5xx: errore lato server
 *  - default: messaggio generico con status code
 *
 * IMPORTANTE: ritriamo l'errore con `throwError(() => err)` per consentire
 * ai subscribe locali (es. nel componente) di gestire l'errore in modo
 * specifico, oltre al toast generico mostrato dall'interceptor.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const message = mapErrorMessage(err);
      toast.show(message, 'error');
      return throwError(() => err);
    }),
  );
};

/**
 * Mappa l'HttpErrorResponse in una stringa amichevole per l'utente.
 *
 * @param err - L'errore intercettato.
 * @returns Stringa user-facing da mostrare nel toast.
 */
function mapErrorMessage(err: HttpErrorResponse): string {
  switch (err.status) {
    case 0:
      return 'Server irraggiungibile. Verifica che json-server sia attivo.';
    case 401:
      return 'Sessione scaduta. Effettua di nuovo il login.';
    case 403:
      return 'Operazione non consentita.';
    case 404:
      return 'Risorsa non trovata.';
    default:
      if (err.status >= 500) {
        return `Errore del server (${err.status}). Riprova piu tardi.`;
      }
      return `Errore HTTP ${err.status}.`;
  }
}
