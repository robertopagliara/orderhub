import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { Customer } from '../../core/models/customer.model';
import { CustomerService } from '../../core/services/customer.service';

/**
 * Lista clienti.
 *
 * Stesso pattern di ProductListComponent: container con service +
 * signal di filtro testuale + computed sulla lista filtrata.
 *
 * Il filtro qui e' un input di ricerca free-text (case-insensitive su
 * name + email): mostra come applicare un filtro testuale lato client.
 */
@Component({
  selector: 'app-customer-list',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">Clienti</h2>
          <p class="text-sm text-slate-400">
            {{ filteredCustomers().length }} di {{ customers().length }} clienti
          </p>
        </div>

        <div class="flex items-center gap-2">
          <input
            type="search"
            [value]="search()"
            (input)="onSearch($event)"
            placeholder="Cerca per nome o email…"
            class="w-full max-w-xs rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <a
            routerLink="/customers/new"
            class="whitespace-nowrap rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-red-600"
          >
            + Nuovo cliente
          </a>
        </div>
      </header>

      <div class="overflow-x-auto rounded-lg border border-slate-800">
        <table class="min-w-full divide-y divide-slate-800">
          <thead class="bg-slate-950/60">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Nome
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 bg-slate-950/30">
            @for (c of filteredCustomers(); track c.id) {
              <tr
                (click)="onSelect(c)"
                (keydown.enter)="onSelect(c)"
                role="button"
                tabindex="0"
                class="cursor-pointer transition hover:bg-slate-900"
              >
                <td class="px-4 py-3 text-sm font-medium text-white">{{ c.name }}</td>
                <td class="px-4 py-3 text-sm text-slate-300">{{ c.email }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="2" class="px-4 py-8 text-center text-sm text-slate-400">
                  Nessun cliente corrisponde alla ricerca.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class CustomerListComponent {
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);

  protected readonly customers = toSignal(this.customerService.getAll(), {
    initialValue: [] as Customer[],
  });

  protected readonly search = signal('');

  protected readonly filteredCustomers = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.customers();
    if (!q) {
      return list;
    }
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  });

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected onSelect(customer: Customer): void {
    this.router.navigate(['/customers', customer.id]);
  }
}
