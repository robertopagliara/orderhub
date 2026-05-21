import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { Order, OrderStatus } from '../../core/models/order.model';

/**
 * Card riassuntiva di un ordine. Componente **presentational**:
 * - riceve un Order via `input.required<Order>()`
 * - emette `select` quando l'utente clicca la card
 * - non conosce il service né l'origine dei dati (responsabilità del container)
 *
 * Pattern moderno: signal-based `input()` / `output()` (Angular 17+).
 * I decorator `@Input()` / `@Output()` sono ancora supportati ma deprecati nel codice nuovo.
 */
@Component({
  selector: 'app-order-card',
  imports: [CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      (click)="select.emit(order())"
      (keydown.enter)="select.emit(order())"
      role="button"
      tabindex="0"
      class="group cursor-pointer rounded-lg border border-slate-800 bg-slate-950/60 p-5 transition hover:border-red-500/50 hover:bg-slate-900"
    >
      <header class="mb-3 flex items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-500">Ordine</p>
          <h3 class="text-lg font-semibold text-white">#{{ order().id }}</h3>
        </div>

        <span
          class="rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset"
          [class]="badgeClass()"
        >
          {{ statusLabel() }}
        </span>
      </header>

      <dl class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt class="text-slate-500">Cliente</dt>
          <dd class="text-slate-200">#{{ order().customerId }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Data</dt>
          <dd class="text-slate-200">
            {{ order().createdAt | date: 'dd/MM/yyyy' }}
          </dd>
        </div>
        <div>
          <dt class="text-slate-500">Righe</dt>
          <dd class="text-slate-200">
            {{ order().items.length }}
            @if (order().items.length > 1) {
              <span class="text-slate-500">prodotti</span>
            } @else {
              <span class="text-slate-500">prodotto</span>
            }
          </dd>
        </div>
        <div class="text-right">
          <dt class="text-slate-500">Totale</dt>
          <dd class="text-base font-semibold text-white">
            {{ order().total | currency: 'EUR' : 'symbol' : '1.2-2' : 'it' }}
          </dd>
        </div>
      </dl>
    </article>
  `,
})
export class OrderCardComponent {
  readonly order = input.required<Order>();
  readonly select = output<Order>();

  protected readonly badgeClass = computed(
    () => this.statusStyles[this.order().status].badge,
  );

  protected readonly statusLabel = computed(
    () => this.statusStyles[this.order().status].label,
  );

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
