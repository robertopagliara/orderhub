import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { LoadingService } from '../../../core/services/loading.service';

/**
 * SpinnerComponent - overlay globale di caricamento (Bonus A).
 *
 * Reagisce al signal `isLoading()` del LoadingService:
 *  - mostra un overlay full-screen con uno spinner CSS quando >= 1
 *    richiesta HTTP e' in volo
 *  - sparisce quando il counter scende a 0
 *
 * Inserito una sola volta in `App` (livello shell): cosi vale per
 * TUTTE le pagine senza che ogni route debba inserirlo manualmente.
 *
 * `ChangeDetectionStrategy.OnPush` + signal = ricalcolo solo al cambio.
 */
@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading.isLoading()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
        role="status"
        aria-live="polite"
      >
        <div
          class="h-12 w-12 animate-spin rounded-full border-4 border-red-500/30 border-t-red-500"
        ></div>
        <span class="sr-only">Caricamento in corso</span>
      </div>
    }
  `,
})
export class SpinnerComponent {
  /**
   * Service iniettato come `protected` per essere letto dal template.
   * Non lo modifichiamo da qui: e' read-only per il componente.
   */
  protected readonly loading = inject(LoadingService);
}
