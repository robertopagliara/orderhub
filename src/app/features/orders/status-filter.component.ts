import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { OrderStatus } from '../../core/models/order.model';

/**
 * Valore selezionabile dal filtro: uno degli stati dell'ordine oppure
 * `'all'` per disattivare il filtro.
 */
export type StatusFilterValue = OrderStatus | 'all';

interface FilterOption {
  value: StatusFilterValue;
  label: string;
}

/**
 * Filtro per status. Componente **presentational** stateless:
 * - riceve il valore corrente via `input.required()`
 * - emette `change` ogni volta che l'utente clicca una pillola
 * - lo stato vero vive nel container (OrderListComponent)
 *
 * Tutta la logica di filtraggio sta nel container, qui si fa solo UI.
 */
@Component({
  selector: 'app-status-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 p-2"
    >
      @for (option of options; track option.value) {
        <button
          type="button"
          (click)="change.emit(option.value)"
          [class]="
            option.value === selected()
              ? 'bg-red-500 text-white shadow'
              : 'text-slate-300 hover:bg-slate-800'
          "
          class="rounded-md px-3 py-1.5 text-sm font-medium transition"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class StatusFilterComponent {
  readonly selected = input.required<StatusFilterValue>();
  readonly change = output<StatusFilterValue>();

  protected readonly options: FilterOption[] = [
    { value: 'all', label: 'Tutti' },
    { value: 'pending', label: 'In attesa' },
    { value: 'shipped', label: 'Spediti' },
    { value: 'delivered', label: 'Consegnati' },
    { value: 'cancelled', label: 'Annullati' },
  ];
}
