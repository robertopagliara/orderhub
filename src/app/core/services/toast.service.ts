import { Injectable, signal } from '@angular/core';

/**
 * Tipo di toast: determina il colore e l'icona renderizzati.
 */
export type ToastType = 'info' | 'success' | 'error';

/**
 * Singolo toast in coda di visualizzazione.
 */
export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

/**
 * ToastService - notifiche transitorie globali (Bonus A).
 *
 * I componenti consumatori (es. `ToastContainerComponent`) leggono
 * `toasts()` e renderizzano i messaggi. I service che vogliono
 * notificare l'utente chiamano `show(message, type)`.
 *
 * Pattern signal-based con sequenze auto-dismissive:
 *  - signal privato `_toasts` (writable solo dal service)
 *  - readonly `toasts` esposto come Signal<readonly Toast[]>
 *  - ogni show schedula un dismiss automatico dopo 3 secondi
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** Coda corrente di toast da mostrare. */
  private readonly _toasts = signal<Toast[]>([]);

  /**
   * Lista readonly dei toast attivi.
   * Il template del container la legge in modo reattivo.
   */
  readonly toasts = this._toasts.asReadonly();

  /**
   * Contatore monotono per generare id univoci tra i toast.
   * Sufficiente per il LAB; in produzione si userebbe crypto.randomUUID().
   */
  private nextId = 0;

  /** Tempo di permanenza di default (ms) prima dell'auto-dismiss. */
  private readonly autoDismissMs = 3000;

  /**
   * Aggiunge un toast alla coda e schedula l'auto-dismiss.
   *
   * @param message - Testo da mostrare all'utente.
   * @param type - Variante di colore (default 'info').
   * @returns L'id del toast generato (utile per dismiss manuale anticipato).
   */
  show(message: string, type: ToastType = 'info'): number {
    const id = ++this.nextId;
    this._toasts.update((arr) => [...arr, { id, message, type }]);
    setTimeout(() => this.dismiss(id), this.autoDismissMs);
    return id;
  }

  /**
   * Rimuove dalla coda il toast con l'id specificato.
   * Idempotente: se l'id non esiste, non fa nulla.
   *
   * @param id - Id del toast da rimuovere.
   */
  dismiss(id: number): void {
    this._toasts.update((arr) => arr.filter((t) => t.id !== id));
  }
}
