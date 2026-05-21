import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';

import { Customer } from '../../core/models/customer.model';
import { Order, OrderStatus } from '../../core/models/order.model';
import { CustomerService } from '../../core/services/customer.service';
import { OrderService } from '../../core/services/order.service';

/**
 * Stato locale renderizzato dal template di OrderDetailComponent.
 * Lo modelliamo come union per gestire in modo type-safe i tre casi
 * principali (loading, ok, errore).
 */
type DetailViewModel =
  | { status: 'loading' }
  | { status: 'loaded'; order: Order; customer: Customer | null }
  | { status: 'error'; message: string };

/**
 * OrderDetailComponent - dettaglio di un singolo ordine (Sprint 2).
 *
 * Responsabilita:
 *  - leggere il parametro `:id` dall'URL via `ActivatedRoute.paramMap`
 *    (Observable, reagisce anche a cambi successivi senza reistanziare)
 *  - chiamare in PARALLELO `orderService.getById(id)` e
 *    `customerService.getById(customerId)` via `forkJoin`: una sola
 *    emissione quando entrambe le chiamate completano
 *  - mostrare un loading state durante il fetch, un error state se il
 *    backend risponde 404, lo stato "loaded" altrimenti
 *  - bottoni di navigazione: torna alla lista, modifica (route :id/edit
 *    sara implementata nello Sprint 3)
 *
 * `ChangeDetectionStrategy.OnPush` e signal per performance ottimali.
 */
@Component({
  selector: 'app-order-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-white">Dettaglio ordine</h2>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
            (click)="backToList()"
          >
            Torna alla lista
          </button>

          @if (view().status === 'loaded') {
            <a
              [routerLink]="['/orders', orderId(), 'edit']"
              class="rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-red-600"
            >
              Modifica
            </a>
          }
        </div>
      </header>

      @switch (view().status) {
        @case ('loading') {
          <p class="rounded-lg border border-slate-800 bg-slate-950/40 p-6 text-slate-400">
            Caricamento dettaglio ordine...
          </p>
        }

        @case ('error') {
          <div class="rounded-lg border border-red-500/40 bg-red-500/10 p-6 text-red-300">
            <p class="font-medium">Impossibile caricare l'ordine.</p>
            <p class="mt-1 text-sm">{{ errorMessage() }}</p>
          </div>
        }

        @case ('loaded') {
          <article class="space-y-6 rounded-lg border border-slate-800 bg-slate-950/60 p-6">
            <header class="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-500">Ordine</p>
                <h3 class="text-xl font-semibold text-white">#{{ loadedOrder().id }}</h3>
                <p class="mt-1 text-sm text-slate-400">
                  Creato il
                  {{ loadedOrder().createdAt | date: 'dd/MM/yyyy HH:mm' }}
                </p>
              </div>
              <span
                class="rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset"
                [class]="badgeClassFor(loadedOrder().status)"
              >
                {{ statusLabelFor(loadedOrder().status) }}
              </span>
            </header>

            <section>
              <h4 class="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Cliente
              </h4>
              @if (loadedCustomer(); as c) {
                <p class="mt-1 text-slate-100">{{ c.name }}</p>
                <p class="text-sm text-slate-400">{{ c.email }}</p>
              } @else {
                <p class="mt-1 text-sm italic text-slate-500">
                  Cliente non trovato (id {{ loadedOrder().customerId }}).
                </p>
              }
            </section>

            <section>
              <h4 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Righe ({{ loadedOrder().items.length }})
              </h4>
              <ul class="divide-y divide-slate-800 overflow-hidden rounded-md border border-slate-800">
                @for (item of loadedOrder().items; track item.productId) {
                  <li class="grid grid-cols-12 gap-3 p-3 text-sm text-slate-200">
                    <span class="col-span-6">{{ item.name }}</span>
                    <span class="col-span-2 text-right text-slate-400">x{{ item.qty }}</span>
                    <span class="col-span-2 text-right text-slate-400">
                      {{ item.price | currency: 'EUR' : 'symbol' : '1.2-2' : 'it' }}
                    </span>
                    <span class="col-span-2 text-right font-medium text-white">
                      {{ item.price * item.qty | currency: 'EUR' : 'symbol' : '1.2-2' : 'it' }}
                    </span>
                  </li>
                }
              </ul>
            </section>

            <footer class="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <span class="text-sm text-slate-400">Totale ordine</span>
              <span class="text-xl font-bold text-white">
                {{ loadedOrder().total | currency: 'EUR' : 'symbol' : '1.2-2' : 'it' }}
              </span>
            </footer>
          </article>
        }
      }
    </section>
  `,
})
export class OrderDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly customerService = inject(CustomerService);

  /**
   * View model corrente. Aggiornato ad ogni cambio del parametro :id.
   */
  protected readonly view = signal<DetailViewModel>({ status: 'loading' });

  constructor() {
    /**
     * Pipeline: paramMap -> switchMap a forkJoin order + customer.
     *
     *  - `paramMap`: Observable che emette ogni cambio del parametro :id.
     *  - `switchMap`: per ogni id, lancia una nuova ricerca dati e
     *    CANCELLA la precedente (cambio rapido di route = niente race).
     *  - `forkJoin({ order, customer })`: chiamate parallele, una
     *    sola emissione quando entrambe completano.
     *  - Sul cliente useremo `of(null)` come fallback se il backend
     *    risponde 404 sul customer (l'ordine resta visualizzabile).
     */
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            return of({ status: 'error' as const, message: 'Id mancante.' });
          }

          this.view.set({ status: 'loading' });

          return this.orderService.getById(id).pipe(
            switchMap((order) =>
              forkJoin({
                order: of(order),
                customer: this.customerService
                  .getById(order.customerId)
                  .pipe(
                    // se il customer non esiste, mostriamo l'ordine senza panic.
                    switchMap((c) => of(c)),
                  ),
              }).pipe(
                switchMap((bundle) =>
                  of({
                    status: 'loaded' as const,
                    order: bundle.order,
                    customer: bundle.customer,
                  }),
                ),
              ),
            ),
          );
        }),
      )
      .subscribe({
        next: (vm) => this.view.set(vm as DetailViewModel),
        error: (err) =>
          this.view.set({
            status: 'error',
            message:
              err?.message ??
              'Errore di rete durante il caricamento del dettaglio.',
          }),
      });
  }

  /**
   * Id dell'ordine corrente quando il view-model e' in stato `loaded`.
   * Usato dal template per costruire il routerLink di "Modifica".
   */
  protected orderId(): string | null {
    const current = this.view();
    return current.status === 'loaded' ? current.order.id : null;
  }

  /**
   * Helper di lettura: ordine corrente, da usare nel template SOLO
   * dentro il caso `@case ('loaded')`.
   */
  protected loadedOrder(): Order {
    const current = this.view();
    if (current.status !== 'loaded') {
      throw new Error('loadedOrder chiamato fuori dallo stato loaded');
    }
    return current.order;
  }

  /**
   * Helper di lettura del customer (puo essere null se 404).
   */
  protected loadedCustomer(): Customer | null {
    const current = this.view();
    return current.status === 'loaded' ? current.customer : null;
  }

  protected errorMessage(): string {
    const current = this.view();
    return current.status === 'error' ? current.message : '';
  }

  /**
   * Navigazione programmatica verso la lista ordini.
   */
  protected backToList(): void {
    this.router.navigate(['/orders']);
  }

  /**
   * Etichetta human-readable per uno status.
   */
  protected statusLabelFor(status: OrderStatus): string {
    return this.statusStyles[status].label;
  }

  /**
   * Classi Tailwind per il badge dello status.
   */
  protected badgeClassFor(status: OrderStatus): string {
    return this.statusStyles[status].badge;
  }

  /**
   * Map degli stili per ogni status. Riusato dall'OrderCardComponent
   * con la stessa palette per coerenza visiva.
   */
  private readonly statusStyles: Record<
    OrderStatus,
    { label: string; badge: string }
  > = {
    pending: {
      label: 'In attesa',
      badge: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
    },
    shipped: {
      label: 'Spedito',
      badge: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
    },
    delivered: {
      label: 'Consegnato',
      badge: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    },
    cancelled: {
      label: 'Annullato',
      badge: 'bg-red-500/15 text-red-300 ring-red-500/30',
    },
  };
}
