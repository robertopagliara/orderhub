import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

/**
 * Lista del catalogo prodotti (parte CORE del progetto finale).
 *
 * Stesso pattern di OrderListComponent: container che orchestra il
 * service, mantiene il filtro in un signal, calcola la lista filtrata
 * in un computed, delega il rendering a una tabella semplice.
 *
 * Click su riga → naviga al dettaglio `/products/:id`.
 */
@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">Prodotti</h2>
          <p class="text-sm text-slate-400">
            {{ filteredProducts().length }} di {{ products().length }} prodotti
          </p>
        </div>

        <div class="flex items-center gap-2">
          <label class="flex items-center gap-2 text-sm">
            <span class="text-slate-400">Categoria:</span>
            <select
              [value]="category()"
              (change)="onCategoryChange($event)"
              class="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="all">Tutte</option>
              @for (c of categories(); track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
          </label>
          <a
            routerLink="/products/new"
            class="whitespace-nowrap rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-red-600"
          >
            + Nuovo prodotto
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
                Categoria
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                Prezzo
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 bg-slate-950/30">
            @for (p of filteredProducts(); track p.id) {
              <tr
                (click)="onSelect(p)"
                (keydown.enter)="onSelect(p)"
                role="button"
                tabindex="0"
                class="cursor-pointer transition hover:bg-slate-900"
              >
                <td class="px-4 py-3 text-sm font-medium text-white">{{ p.name }}</td>
                <td class="px-4 py-3 text-sm text-slate-300">{{ p.category }}</td>
                <td class="px-4 py-3 text-right text-sm font-semibold text-white">
                  {{ p.price | currency: 'EUR' : 'symbol' : '1.2-2' : 'it' }}
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="px-4 py-8 text-center text-sm text-slate-400">
                  Nessun prodotto in questa categoria.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class ProductListComponent {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);

  protected readonly products = toSignal(this.productService.getAll(), {
    initialValue: [] as Product[],
  });

  /** Filtro categoria: 'all' oppure il nome di una categoria. */
  protected readonly category = signal<string>('all');

  /** Elenco unico delle categorie presenti nel catalogo. */
  protected readonly categories = computed(() =>
    Array.from(new Set(this.products().map((p) => p.category))).sort(),
  );

  protected readonly filteredProducts = computed(() => {
    const current = this.category();
    const list = this.products();
    return current === 'all'
      ? list
      : list.filter((p) => p.category === current);
  });

  protected onCategoryChange(event: Event): void {
    this.category.set((event.target as HTMLSelectElement).value);
  }

  protected onSelect(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }
}
