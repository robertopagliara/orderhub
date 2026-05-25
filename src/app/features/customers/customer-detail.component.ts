import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';

import { Customer } from '../../core/models/customer.model';
import { Order, OrderStatus } from '../../core/models/order.model';
import { CustomerService } from '../../core/services/customer.service';
import { OrderService } from '../../core/services/order.service';

/**
 * View model: union per gestire loading / loaded / error in modo type-safe.
 */
type DetailViewModel =
  | { status: 'loading' }
  | { status: 'loaded'; customer: Customer; orders: Order[] }
  | { status: 'error'; message: string };

/**
 * Dettaglio cliente + storico ordini.
 *
 * Pattern stesso di OrderDetail:
 *  - `:id` da ActivatedRoute.paramMap
 *  - `forkJoin` per chiamare in parallelo `getById(customer)` e
 *    `getByCustomerId(orders)`: una sola emissione finale quando entrambe
 *    completano
 *  - `switchMap` annulla chiamate precedenti se il param cambia
 *  - `takeUntilDestroyed` per il cleanup della subscription
 */
@Component({
  selector: 'app-customer-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <a
        routerLink="/customers"
        class="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
      >
        ← Torna ai clienti
      </a>

      @switch (vm().status) {
        @case ('loading') {
          <p class="rounded-md border border-dashed border-slate-700 p-6 text-sm text-slate-400">
            Caricamento cliente…
          </p>
        }

        @case ('error') {
          @if (asError(vm()); as e) {
            <p class="rounded-md border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-300">
              {{ e.message }}
            </p>
          }
        }

        @case ('loaded') {
          @if (asLoaded(vm()); as data) {
            <article class="rounded-lg border border-slate-800 bg-slate-950/60 p-6">
              <header class="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs uppercase tracking-wide text-slate-500">Cliente</p>
                  <h2 class="text-2xl font-bold text-white">{{ data.customer.name }}</h2>
                  <p class="text-sm text-slate-400">{{ data.customer.email }}</p>
                </div>
                <div class="flex shrink-0 gap-2">
                  <a
                    [routerLink]="['/customers', data.customer.id, 'edit']"
                    class="rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
                  >
                    Modifica
                  </a>
                  <button
                    type="button"
                    (click)="onDelete(data.customer, data.orders.length)"
                    [disabled]="deleting()"
                    class="rounded-md border border-red-500/40 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Elimina
                  </button>
                </div>
              </header>

              <dl class="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <dt class="text-slate-500">Codice</dt>
                  <dd class="font-mono text-slate-200">{{ data.customer.id }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500">Ordini totali</dt>
                  <dd class="text-2xl font-bold text-white">{{ data.orders.length }}</dd>
                </div>
                <div class="text-right">
                  <dt class="text-slate-500">Spesa totale</dt>
                  <dd class="text-2xl font-bold text-white">
                    {{ totalSpent(data.orders) | currency: 'EUR' : 'symbol' : '1.2-2' : 'it' }}
                  </dd>
                </div>
              </dl>
            </article>

            <section class="space-y-3">
              <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Storico ordini
              </h3>

              <div class="overflow-x-auto rounded-lg border border-slate-800">
                <table class="min-w-full divide-y divide-slate-800">
                  <thead class="bg-slate-950/60">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">#</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Data</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Totale</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800 bg-slate-950/30">
                    @for (o of data.orders; track o.id) {
                      <tr
                        [routerLink]="['/orders', o.id]"
                        role="button"
                        tabindex="0"
                        class="cursor-pointer transition hover:bg-slate-900"
                      >
                        <td class="px-4 py-3 text-sm font-medium text-white">#{{ o.id }}</td>
                        <td class="px-4 py-3 text-sm text-slate-300">
                          {{ o.createdAt | date: 'dd/MM/yyyy' }}
                        </td>
                        <td class="px-4 py-3 text-sm">
                          <span [class]="badgeClass(o.status)" class="rounded-full px-2 py-0.5 text-xs ring-1 ring-inset">
                            {{ statusLabel(o.status) }}
                          </span>
                        </td>
                        <td class="px-4 py-3 text-right text-sm font-semibold text-white">
                          {{ o.total | currency: 'EUR' : 'symbol' : '1.2-2' : 'it' }}
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="4" class="px-4 py-8 text-center text-sm text-slate-400">
                          Nessun ordine per questo cliente.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }
        }
      }
    </section>
  `,
})
export class CustomerDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customerService = inject(CustomerService);
  private readonly orderService = inject(OrderService);

  protected readonly vm = signal<DetailViewModel>({ status: 'loading' });

  /** Flag mentre la DELETE è in volo, disabilita il bottone Elimina. */
  protected readonly deleting = signal(false);

  protected asLoaded(
    vm: DetailViewModel,
  ): Extract<DetailViewModel, { status: 'loaded' }> | null {
    return vm.status === 'loaded' ? vm : null;
  }

  protected asError(
    vm: DetailViewModel,
  ): Extract<DetailViewModel, { status: 'error' }> | null {
    return vm.status === 'error' ? vm : null;
  }

  protected totalSpent(orders: Order[]): number {
    return orders.reduce((sum, o) => sum + o.total, 0);
  }

  protected statusLabel(status: OrderStatus): string {
    return {
      pending: 'In attesa',
      shipped: 'Spedito',
      delivered: 'Consegnato',
      cancelled: 'Annullato',
    }[status];
  }

  protected badgeClass(status: OrderStatus): string {
    return {
      pending: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
      shipped: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
      delivered: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
      cancelled: 'bg-red-500/15 text-red-300 ring-red-500/30',
    }[status];
  }

  /**
   * Elimina il cliente previa conferma dell'utente.
   *
   * Se il cliente ha ordini, l'avviso lo segnala: json-server non ha
   * integrità referenziale, quindi gli ordini orfani resteranno nel db
   * con un customerId puntante a un cliente eliminato. In un backend
   * reale si gestirebbe con FK / soft-delete.
   */
  protected onDelete(customer: Customer, orderCount: number): void {
    const warning =
      orderCount > 0
        ? `\n\nAttenzione: il cliente ha ${orderCount} ordini collegati che resteranno nel sistema con un riferimento orfano.`
        : '';
    const ok = confirm(
      `Eliminare definitivamente il cliente "${customer.name}"?${warning}`,
    );
    if (!ok) {
      return;
    }

    this.deleting.set(true);
    this.customerService.delete(customer.id).subscribe({
      next: () => this.router.navigate(['/customers']),
      error: () => this.deleting.set(false),
    });
  }

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            throw new Error('ID cliente mancante dalla rotta');
          }
          this.vm.set({ status: 'loading' });
          return forkJoin({
            customer: this.customerService.getById(id),
            orders: this.orderService.getByCustomerId(id),
          });
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: ({ customer, orders }) =>
          this.vm.set({ status: 'loaded', customer, orders }),
        error: () =>
          this.vm.set({
            status: 'error',
            message: 'Cliente non trovato o errore di rete.',
          }),
      });
  }
}
