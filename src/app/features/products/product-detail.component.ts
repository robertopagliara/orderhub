import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

/**
 * View model del template: union per gestire in modo type-safe i tre
 * stati possibili (loading, loaded, error). Stesso pattern di
 * OrderDetailComponent.
 */
type DetailViewModel =
  | { status: 'loading' }
  | { status: 'loaded'; product: Product }
  | { status: 'error'; message: string };

/**
 * Dettaglio di un singolo prodotto.
 *
 * Pattern:
 *  - legge `:id` da `ActivatedRoute.paramMap` (reattivo a cambi rotta)
 *  - `switchMap` cancella richieste precedenti se l'id cambia rapidamente
 *  - `takeUntilDestroyed` per il cleanup automatico della subscription
 *  - signal `vm` come unica sorgente di verita del template
 */
@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <a
        routerLink="/products"
        class="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
      >
        ← Torna al catalogo
      </a>

      @switch (vm().status) {
        @case ('loading') {
          <p class="rounded-md border border-dashed border-slate-700 p-6 text-sm text-slate-400">
            Caricamento prodotto…
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
                  <p class="text-xs uppercase tracking-wide text-slate-500">Prodotto</p>
                  <h2 class="text-2xl font-bold text-white">
                    {{ data.product.name }}
                  </h2>
                </div>
                <span
                  class="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300"
                >
                  {{ data.product.category }}
                </span>
              </header>

              <dl class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt class="text-slate-500">Codice</dt>
                  <dd class="font-mono text-slate-200">{{ data.product.id }}</dd>
                </div>
                <div class="text-right">
                  <dt class="text-slate-500">Prezzo unitario</dt>
                  <dd class="text-2xl font-bold text-white">
                    {{
                      data.product.price
                        | currency: 'EUR' : 'symbol' : '1.2-2' : 'it'
                    }}
                  </dd>
                </div>
              </dl>
            </article>
          }
        }
      }
    </section>
  `,
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  protected readonly vm = signal<DetailViewModel>({ status: 'loading' });

  /**
   * Type guard helper per `@case ('loaded')`: restringe il tipo del vm
   * in modo che il template acceda a `data.product` con autocomplete.
   * Necessario perche' `@switch` da solo non restringe il discriminant.
   */
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

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            throw new Error('ID prodotto mancante dalla rotta');
          }
          this.vm.set({ status: 'loading' });
          return this.productService.getById(id);
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (product) => this.vm.set({ status: 'loaded', product }),
        error: () =>
          this.vm.set({
            status: 'error',
            message: 'Prodotto non trovato o errore di rete.',
          }),
      });
  }
}
