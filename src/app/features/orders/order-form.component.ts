import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Customer } from '../../core/models/customer.model';
import { Order, OrderStatus } from '../../core/models/order.model';
import { Product } from '../../core/models/product.model';
import { CustomerService } from '../../core/services/customer.service';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { OrderItemRowComponent } from './order-item-row.component';

/**
 * Validatore custom su un FormArray: pretende almeno un elemento.
 *
 * `Validators.required` su un FormArray verifica solo che non sia null:
 * un array vuoto e' considerato valido, ed e' praticamente sempre
 * un errore di UX (ordine senza items). Lo gestiamo con un validatore
 * dedicato che ritorna `{ minLength: { required: 1, actual: 0 } }`
 * quando l'array e' vuoto.
 */
function minOneItem(
  control: AbstractControl,
): ValidationErrors | null {
  const array = control as FormArray;
  return array.length >= 1
    ? null
    : { minLength: { required: 1, actual: array.length } };
}

/**
 * Stati locali della modalita del form.
 *  - 'new': creazione di un nuovo ordine
 *  - 'edit': modifica di un ordine esistente
 */
type FormMode = 'new' | 'edit';

/**
 * OrderFormComponent - form di creazione/modifica ordine (Sprint 3).
 *
 * Pattern Reactive Forms con FormArray dinamico per le righe ordine.
 *  - NonNullableFormBuilder per controlli tipizzati senza `| null`
 *  - FormArray<FormGroup> con validatore custom `minOneItem`
 *  - validatori built-in (required, min) su tutti i campi
 *  - dropdown clienti popolato via `toSignal(customerService.getAll())`
 *  - dropdown prodotti (passato ad ogni riga) popolato via `toSignal(productService.getAll())`
 *  - select status con tutti gli `OrderStatus`
 *  - submit chiama create() o update() in base alla modalita
 *  - in modalita 'edit': fetch ordine + patchValue del form
 *  - calcolo del totale via `computed` sul signal del valueChanges
 *  - dopo submit: navigate alla lista
 *
 * IMPORTANTE — pattern signal per i FormGroup figli:
 *   `valueChanges` di un FormArray emette VALORI (plain object), non
 *   `FormGroup`. Per esporre i `FormGroup` figli al template in modo
 *   reattivo usiamo un signal "revision counter" che bumpiamo a ogni
 *   push/removeAt/clear; `itemsControls` e' poi un `computed` che legge
 *   il counter (per dichiarare la dipendenza) e ritorna `items.controls`.
 */
@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule, CurrencyPipe, OrderItemRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-white">
          {{ mode() === 'new' ? 'Nuovo ordine' : 'Modifica ordine' }}
        </h2>
        <button
          type="button"
          class="rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
          (click)="cancel()"
        >
          Annulla
        </button>
      </header>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="space-y-6 rounded-lg border border-slate-800 bg-slate-950/60 p-6"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              for="customerId"
              class="block text-xs uppercase tracking-wide text-slate-500"
            >
              Cliente
            </label>
            <select
              id="customerId"
              formControlName="customerId"
              class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="">Seleziona un cliente</option>
              @for (c of customers(); track c.id) {
                <option [value]="c.id">{{ c.name }} ({{ c.email }})</option>
              }
            </select>
            @if (showError('customerId')) {
              <small class="mt-1 block text-xs text-red-400">
                Cliente obbligatorio.
              </small>
            }
          </div>

          <div>
            <label
              for="status"
              class="block text-xs uppercase tracking-wide text-slate-500"
            >
              Status
            </label>
            <select
              id="status"
              formControlName="status"
              class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              @for (s of statusOptions; track s) {
                <option [value]="s">{{ statusLabel(s) }}</option>
              }
            </select>
          </div>
        </div>

        <section>
          <header class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Righe ordine ({{ items.length }})
            </h3>
            <button
              type="button"
              (click)="addItem()"
              class="rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-red-600"
            >
              + Aggiungi riga
            </button>
          </header>

          <div class="space-y-3">
            @for (group of itemsControls(); track $index) {
              <app-order-item-row
                [group]="group"
                [index]="$index"
                [products]="products()"
                (remove)="removeItem($event)"
              />
            } @empty {
              <p class="rounded-md border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
                Nessuna riga. Clicca "+ Aggiungi riga" per iniziare.
              </p>
            }
          </div>

          @if (showItemsError()) {
            <small class="mt-2 block text-xs text-red-400">
              L'ordine deve contenere almeno una riga.
            </small>
          }
        </section>

        <footer class="flex items-center justify-between border-t border-slate-800 pt-4">
          <div>
            <span class="text-xs uppercase tracking-wide text-slate-500">Totale</span>
            <p class="text-2xl font-bold text-white">
              {{ total() | currency: 'EUR' : 'symbol' : '1.2-2' : 'it' }}
            </p>
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
              (click)="cancel()"
            >
              Annulla
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || submitting()"
              class="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {{ mode() === 'new' ? 'Crea ordine' : 'Salva modifiche' }}
            </button>
          </div>
        </footer>
      </form>
    </section>
  `,
})
export class OrderFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);

  /** Modalita del form: 'new' o 'edit' (signal derivato dalla route). */
  protected readonly mode = signal<FormMode>('new');

  /** Id dell'ordine in editing. `null` in modalita 'new'. */
  protected readonly editingId = signal<string | null>(null);

  /** Flag mentre il submit e' in volo, blocca il bottone "Salva". */
  protected readonly submitting = signal(false);

  /** Lista clienti per il dropdown. */
  protected readonly customers = toSignal(this.customerService.getAll(), {
    initialValue: [] as Customer[],
  });

  /**
   * Catalogo prodotti per i dropdown delle righe.
   * Lo carichiamo una volta e lo passiamo a ogni `app-order-item-row`.
   */
  protected readonly products = toSignal(this.productService.getAll(), {
    initialValue: [] as Product[],
  });

  /** Status possibili per il select. */
  protected readonly statusOptions: OrderStatus[] = [
    'pending',
    'shipped',
    'delivered',
    'cancelled',
  ];

  /**
   * Form principale.
   * - customerId: required, valore iniziale stringa vuota
   * - status: required, default 'pending'
   * - items: FormArray con validatore custom `minOneItem`
   */
  protected readonly form = this.fb.group({
    customerId: this.fb.control('', Validators.required),
    status: this.fb.control<OrderStatus>('pending', Validators.required),
    items: this.fb.array<FormGroup>([], minOneItem),
  });

  /** Comoda lettura del FormArray "items". */
  protected get items(): FormArray<FormGroup> {
    return this.form.controls.items;
  }

  /**
   * Counter che bumpiamo a ogni mutazione strutturale del FormArray
   * (push, removeAt, clear). Serve solo come "trigger" per i computed
   * che dipendono dalla collezione dei controls.
   */
  private readonly itemsRevision = signal(0);

  /**
   * Signal con i FormGroup figli del FormArray, esposto al template.
   * Dichiara la dipendenza da `itemsRevision` per ricalcolarsi a ogni
   * push/remove. Ritorna i `controls` veri (oggetti FormGroup), non i
   * loro valori — cosi `[formGroup]="group()"` nel figlio funziona.
   */
  protected readonly itemsControls = computed<FormGroup[]>(() => {
    this.itemsRevision();
    return this.items.controls;
  });

  /**
   * Snapshot reattivo dei VALORI del FormArray. Lo usiamo solo per
   * ricalcolare il totale a ogni keystroke su qty/price.
   */
  private readonly itemsValue = toSignal(this.items.valueChanges, {
    initialValue: this.items.value,
  });

  /**
   * Totale dell'ordine, somma di qty*price su ogni riga.
   * Reattivo grazie a `itemsValue` (cambi di valori) e `itemsRevision`
   * (aggiunte/rimozioni di righe).
   */
  protected readonly total = computed(() => {
    this.itemsRevision();
    const values = this.itemsValue();
    return values.reduce(
      (sum, v) =>
        sum + (Number(v.qty) || 0) * (Number(v.price) || 0),
      0,
    );
  });

  /**
   * Mostra l'errore "obbligatorio" solo se il campo e' touched o dirty.
   */
  protected showError(name: 'customerId' | 'status'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  /**
   * Mostra l'errore sul FormArray "items" solo dopo che l'utente ha
   * provato a fare submit o ha modificato qualcosa.
   */
  protected showItemsError(): boolean {
    return this.items.invalid && (this.form.touched || this.form.dirty);
  }

  constructor() {
    /**
     * Lettura della route: decidiamo new vs edit in base al parametro `:id`.
     */
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const id = params.get('id');
        if (id) {
          this.mode.set('edit');
          this.editingId.set(id);
          this.loadOrderForEdit(id);
        } else {
          this.mode.set('new');
          this.editingId.set(null);
          this.items.clear();
          this.items.push(this.buildItemGroup());
          this.bumpItems();
        }
      });

    /**
     * Effect di debug (opzionale): logga il totale ogni volta che cambia.
     * Esempio di `effect` su signal computed.
     */
    effect(() => {
      const t = this.total();
      if (this.form.dirty) {
        console.debug('[OrderForm] totale aggiornato:', t);
      }
    });
  }

  /**
   * Carica un ordine esistente dal backend e patcha il form.
   */
  private loadOrderForEdit(id: string): void {
    this.orderService
      .getById(id)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (order) => {
          this.items.clear();
          for (const it of order.items) {
            this.items.push(this.buildItemGroup(it));
          }
          this.bumpItems();
          this.form.patchValue({
            customerId: order.customerId,
            status: order.status,
          });
          this.form.markAsPristine();
        },
        error: (err) => {
          console.error('[OrderForm] errore caricamento ordine:', err);
          this.router.navigate(['/orders']);
        },
      });
  }

  /**
   * Costruisce un FormGroup per una singola riga dell'ordine.
   */
  private buildItemGroup(
    value: { productId?: string; name?: string; qty?: number; price?: number } = {},
  ): FormGroup {
    return this.fb.group({
      productId: this.fb.control(value.productId ?? '', Validators.required),
      name: this.fb.control(value.name ?? '', Validators.required),
      qty: this.fb.control(value.qty ?? 1, [Validators.required, Validators.min(1)]),
      price: this.fb.control(value.price ?? 0, [Validators.required, Validators.min(0)]),
    });
  }

  /**
   * Incrementa il counter per notificare ai computed che la collezione
   * dei controls e' cambiata strutturalmente.
   */
  private bumpItems(): void {
    this.itemsRevision.update((v) => v + 1);
  }

  /** Aggiunge una riga vuota al FormArray. */
  protected addItem(): void {
    this.items.push(this.buildItemGroup());
    this.items.markAsDirty();
    this.bumpItems();
  }

  /** Rimuove la riga all'indice dato. */
  protected removeItem(index: number): void {
    this.items.removeAt(index);
    this.items.markAsDirty();
    this.bumpItems();
  }

  /**
   * Submit del form. In base alla modalita chiama create() o update()
   * sul service, poi naviga alla lista.
   */
  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const value = this.form.getRawValue();

    const total = (value.items as Array<{ qty: number; price: number }>).reduce(
      (sum, it) => sum + it.qty * it.price,
      0,
    );

    if (this.mode() === 'edit' && this.editingId()) {
      const order: Order = {
        id: this.editingId()!,
        customerId: value.customerId,
        status: value.status,
        items: value.items as Order['items'],
        total,
        createdAt: new Date().toISOString(),
      };

      this.orderService.update(order).subscribe({
        next: () => this.router.navigate(['/orders']),
        error: () => this.submitting.set(false),
      });
    } else {
      const order: Order = {
        id: crypto.randomUUID(),
        customerId: value.customerId,
        status: value.status,
        items: value.items as Order['items'],
        total,
        createdAt: new Date().toISOString(),
      };

      this.orderService.create(order).subscribe({
        next: () => this.router.navigate(['/orders']),
        error: () => this.submitting.set(false),
      });
    }
  }

  /** Annulla la modifica e torna alla lista. */
  protected cancel(): void {
    this.router.navigate(['/orders']);
  }

  /** Mappa status -> etichetta in italiano per il select. */
  protected statusLabel(status: OrderStatus): string {
    return {
      pending: 'In attesa',
      shipped: 'Spedito',
      delivered: 'Consegnato',
      cancelled: 'Annullato',
    }[status];
  }
}
