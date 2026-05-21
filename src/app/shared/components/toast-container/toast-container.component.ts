import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from '../../../core/services/toast.service';

/**
 * ToastContainerComponent - renderer dei toast attivi (Bonus A).
 *
 * Iterazione reattiva sul signal `toasts()` di ToastService: ogni
 * toast diventa una card animata in basso a destra. Cliccando sulla
 * card si dismissa anticipatamente (oltre all'auto-dismiss dopo 3s).
 *
 * Inserito una sola volta in `App` (livello shell), vale per tutte
 * le pagine senza inserimenti ripetuti.
 *
 * Tailwind si occupa di transizioni e colori per variante (info/success/error).
 * `ChangeDetectionStrategy.OnPush` + signal = re-render solo al cambio.
 */
@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
      aria-live="assertive"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <button
          type="button"
          (click)="toastService.dismiss(toast.id)"
          class="rounded-md border px-4 py-3 text-left text-sm shadow-lg transition hover:opacity-90"
          [class]="styleFor(toast.type)"
        >
          {{ toast.message }}
        </button>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  /**
   * Service esposto come `protected` per il binding di template.
   */
  protected readonly toastService = inject(ToastService);

  /**
   * Map type -> classi Tailwind. Variante per colorare la pillola.
   *
   * @param type - Tipo del toast.
   * @returns Stringa di classi CSS.
   */
  protected styleFor(type: 'info' | 'success' | 'error'): string {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
      case 'error':
        return 'border-red-500/40 bg-red-500/10 text-red-200';
      default:
        return 'border-slate-700 bg-slate-900 text-slate-200';
    }
  }
}
