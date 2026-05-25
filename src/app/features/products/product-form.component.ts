import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

/**
 * Modalita del form: 'new' (POST) oppure 'edit' (PUT).
 */
type FormMode = 'new' | 'edit';

/**
 * ProductFormComponent — form di creazione e modifica prodotto (Bonus D).
 *
 * Stesso pattern di CustomerFormComponent / OrderFormComponent.
 * Tre campi: name, price, category.
 *
 * UX della categoria: input testuale + `<datalist>` con le categorie
 * gia presenti a catalogo. Permette di scegliere una categoria esistente
 * (auto-complete) oppure di crearne una nuova digitando — nessun bisogno
 * di un'entita "Category" separata.
 */
@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-white">
          {{ mode() === 'new' ? 'Nuovo prodotto' : 'Modifica prodotto' }}
        </h2>
        <a
          routerLink="/products"
          class="rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          ← Torna al catalogo
        </a>
      </header>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="space-y-5 rounded-lg border border-slate-800 bg-slate-950/60 p-6"
      >
        <div>
          <label for="name" class="block text-xs uppercase tracking-wide text-slate-500">
            Nome
          </label>
          <input
            id="name"
            type="text"
            formControlName="name"
            class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          @if (showError('name')) {
            <small class="mt-1 block text-xs text-red-400">
              Nome obbligatorio.
            </small>
          }
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="price" class="block text-xs uppercase tracking-wide text-slate-500">
              Prezzo (€)
            </label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              formControlName="price"
              class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-right text-sm text-slate-100"
            />
            @if (showError('price')) {
              <small class="mt-1 block text-xs text-red-400">
                @if (form.controls.price.errors?.['required']) {
                  Prezzo obbligatorio.
                } @else if (form.controls.price.errors?.['min']) {
                  Il prezzo deve essere ≥ 0.
                }
              </small>
            }
          </div>

          <div>
            <label for="category" class="block text-xs uppercase tracking-wide text-slate-500">
              Categoria
            </label>
            <input
              id="category"
              type="text"
              list="category-options"
              formControlName="category"
              placeholder="Es. Smartphone, Audio…"
              class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <datalist id="category-options">
              @for (c of categories(); track c) {
                <option [value]="c"></option>
              }
            </datalist>
            @if (showError('category')) {
              <small class="mt-1 block text-xs text-red-400">
                Categoria obbligatoria.
              </small>
            }
          </div>
        </div>

        <footer class="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
          <a
            routerLink="/products"
            class="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Annulla
          </a>
          <button
            type="submit"
            [disabled]="form.invalid || submitting()"
            class="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {{ mode() === 'new' ? 'Crea prodotto' : 'Salva modifiche' }}
          </button>
        </footer>
      </form>
    </section>
  `,
})
export class ProductFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);

  protected readonly mode = signal<FormMode>('new');
  protected readonly editingId = signal<string | null>(null);
  protected readonly submitting = signal(false);

  /**
   * Catalogo prodotti per estrarre l'elenco delle categorie esistenti
   * (suggerimenti del datalist).
   */
  private readonly products = toSignal(this.productService.getAll(), {
    initialValue: [] as Product[],
  });

  /** Elenco unico delle categorie a catalogo, ordinato alfabeticamente. */
  protected readonly categories = computed(() =>
    Array.from(new Set(this.products().map((p) => p.category))).sort(),
  );

  /**
   * FormGroup tipizzato. Validators built-in:
   *  - name: required
   *  - price: required + min(0) (consentiamo prodotti gratuiti)
   *  - category: required
   */
  protected readonly form = this.fb.group({
    name: this.fb.control('', Validators.required),
    price: this.fb.control(0, [Validators.required, Validators.min(0)]),
    category: this.fb.control('', Validators.required),
  });

  protected showError(name: 'name' | 'price' | 'category'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const id = params.get('id');
        if (id) {
          this.mode.set('edit');
          this.editingId.set(id);
          this.loadProduct(id);
        } else {
          this.mode.set('new');
          this.editingId.set(null);
        }
      });
  }

  private loadProduct(id: string): void {
    this.productService
      .getById(id)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (product) => {
          this.form.patchValue({
            name: product.name,
            price: product.price,
            category: product.category,
          });
          this.form.markAsPristine();
        },
        error: (err) => {
          console.error('[ProductForm] errore caricamento prodotto:', err);
          this.router.navigate(['/products']);
        },
      });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const value = this.form.getRawValue();

    if (this.mode() === 'edit' && this.editingId()) {
      const product: Product = {
        id: this.editingId()!,
        name: value.name,
        price: Number(value.price),
        category: value.category,
      };

      this.productService.update(product).subscribe({
        next: () => this.router.navigate(['/products']),
        error: () => this.submitting.set(false),
      });
    } else {
      const product: Product = {
        id: crypto.randomUUID(),
        name: value.name,
        price: Number(value.price),
        category: value.category,
      };

      this.productService.create(product).subscribe({
        next: () => this.router.navigate(['/products']),
        error: () => this.submitting.set(false),
      });
    }
  }
}
