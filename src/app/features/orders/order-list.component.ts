import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { Order } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { OrderCardComponent } from './order-card.component';
import {
  StatusFilterComponent,
  StatusFilterValue,
} from './status-filter.component';

/**
 * Container della lista ordini.
 *
 * Responsabilità:
 * - parla con OrderService per ottenere i dati
 * - mantiene lo stato del filtro corrente (signal)
 * - calcola la lista filtrata in modo reattivo (computed)
 * - delega il rendering ai presentational OrderCard / StatusFilter
 * - reagisce al `select` emesso dalla card navigando al dettaglio
 *
 * `toSignal` converte l'Observable di HttpClient in un Signal: nessuna
 * subscription manuale, niente leak da gestire, e cleanup automatico.
 */
@Component({
  selector: 'app-order-list',
  imports: [OrderCardComponent, StatusFilterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">Ordini</h2>
          <p class="text-sm text-slate-400">
            {{ filteredOrders().length }} di {{ orders().length }} ordini
          </p>
        </div>

        <app-status-filter
          [selected]="filter()"
          (change)="filter.set($event)"
        />
      </header>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (order of filteredOrders(); track order.id) {
          <app-order-card [order]="order" (select)="onSelect($event)" />
        } @empty {
          <div
            class="col-span-full rounded-lg border border-dashed border-slate-700 bg-slate-950/30 p-12 text-center"
          >
            <p class="text-slate-400">
              Nessun ordine corrisponde al filtro selezionato.
            </p>
          </div>
        }
      </div>
    </section>
  `,
})
export class OrderListComponent {
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  protected readonly orders = toSignal(this.orderService.getOrders(), {
    initialValue: [] as Order[],
  });

  protected readonly filter = signal<StatusFilterValue>('all');

  protected readonly filteredOrders = computed(() => {
    const currentFilter = this.filter();
    const list = this.orders();
    return currentFilter === 'all'
      ? list
      : list.filter((order) => order.status === currentFilter);
  });

  protected onSelect(order: Order): void {
    this.router.navigate(['/orders', order.id]);
  }
}
