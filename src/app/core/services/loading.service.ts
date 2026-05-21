import { Injectable, computed, signal } from '@angular/core';

/**
 * LoadingService - contatore globale di richieste HTTP in volo (Bonus A).
 *
 * Espone:
 *  - `isLoading()` -> computed boolean (true se ci sono >= 1 richieste pending)
 *  - `show()` / `hide()` -> incremento/decremento del contatore
 *
 * Lo usano: `loadingInterceptor` per show/hide automatico ad ogni chiamata
 * HTTP, e `SpinnerComponent` per renderizzare un overlay globale finche
 * il contatore e' > 0.
 *
 * Pattern signal-based:
 *  - signal privato `_count` (sorgente di verita, scrivibile solo dal service)
 *  - computed `isLoading` derivato (riusato sia dal template che da test)
 *  - metodi pubblici come UNICA via per mutare lo stato
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  /**
   * Numero corrente di richieste HTTP in volo.
   * Lo facciamo `private` per impedire ai consumatori di forzarlo
   * a mano: passano sempre per show() / hide().
   */
  private readonly _count = signal(0);

  /**
   * Stato derivato: l'app e' in caricamento se almeno una richiesta
   * e' in volo. Da consumare nel template come `loadingService.isLoading()`.
   */
  readonly isLoading = computed(() => this._count() > 0);

  /**
   * Incrementa il contatore (chiamato dall'interceptor in uscita).
   */
  show(): void {
    this._count.update((c) => c + 1);
  }

  /**
   * Decrementa il contatore (chiamato dall'interceptor in finalize).
   * Non scende mai sotto zero per sicurezza.
   */
  hide(): void {
    this._count.update((c) => Math.max(0, c - 1));
  }
}
