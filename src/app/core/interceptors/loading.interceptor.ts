import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { LoadingService } from '../services/loading.service';

/**
 * loadingInterceptor - incrementa/decrementa il contatore di
 * `LoadingService` ad ogni richiesta HTTP (Bonus A).
 *
 * Flow:
 *  1. Prima di lasciar partire la request, `loading.show()` (count++).
 *  2. Passiamo la request al prossimo handler con `next(req)`.
 *  3. Sull'Observable risultante applichiamo `finalize(() => hide())`
 *     che esegue il decremento sia in caso di success che di error.
 *
 * Registrato in `app.config.ts` con
 * `provideHttpClient(withInterceptors([loadingInterceptor, ...]))`.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);

  loading.show();

  return next(req).pipe(
    // finalize: viene chiamato sia su complete che su error.
    // Garantisce che il counter non si "blocchi" su errore.
    finalize(() => loading.hide()),
  );
};
