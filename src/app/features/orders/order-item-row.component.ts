import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { Product } from '../../core/models/product.model';

/**
 * Tipi dei controlli di un singolo OrderItem dentro al FormArray.
 *
 * Definiamo il "shape" come tipo esplicito per avere autocompletamento
 * tipizzato sui controls del FormGroup (FormControl<string>,
 * FormControl<number>, ...) nei figli che lo ricevono come input.
 */
export interface OrderItemFormShape {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

/**
 * OrderItemRow - presentational per una singola riga del FormArray
 * "items" del form ordine (Sprint 3).
 *
 * Riceve dal padre:
 *  - `group`  : il FormGroup figlio del FormArray (productId/name/qty/price)
 *  - `index`  : posizione nella collezione (serve a `removeAt`)
 *  - `products`: catalogo per popolare il dropdown
 *
 * Emette `remove` quando l'utente clicca il bottone di rimozione.
 *
 * IMPORTANTE: il componente NON crea il FormGroup; lo crea il padre
 * (OrderFormComponent) e glielo passa via input. Cosi tutta la
 * costruzione del form resta centralizzata.
 *
 * I campi `name` e `price` non sono editabili a mano: vengono valorizzati
 * automaticamente quando l'utente sceglie un prodotto dal dropdown
 * (denormalizzazione: catturiamo il valore al momento dell'inserimento).
 * Il `<select>` HTML supporta nativamente la "ricerca digitando": basta
 * iniziare a digitare il nome del prodotto quando ha il focus.
 *
 * `ChangeDetectionStrategy.OnPush`: cambia solo quando cambia il
 * riferimento del FormGroup in input o quando un signal letto dentro
 * il template cambia. FormGroupDirective fa markForCheck a ogni
 * valueChanges, quindi il `subtotal` getter resta sincronizzato.
 */
@Component({
  selector: 'app-order-item-row',
  imports: [ReactiveFormsModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [formGroup]="group()"
      class="grid grid-cols-12 items-end gap-3 rounded-md border border-slate-800 bg-slate-950/30 p-3"
    >
      <div class="col-span-12 sm:col-span-7">
        <label class="block text-xs uppercase tracking-wide text-slate-500">
          Prodotto
        </label>
        <select
          formControlName="productId"
          (change)="onProductChange($event)"
          class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
        >
          <option value="">Seleziona un prodotto</option>
          @for (p of products(); track p.id) {
            <option [value]="p.id">
              {{ p.name }} — {{ p.price | currency: 'EUR' : 'symbol' : '1.2-2' : 'it' }}
            </option>
          }
        </select>
      </div>

      <div class="col-span-4 sm:col-span-2">
        <label class="block text-xs uppercase tracking-wide text-slate-500">
          Q.ta
        </label>
        <input
          type="number"
          min="1"
          formControlName="qty"
          class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-right text-sm text-slate-100"
        />
      </div>

      <div class="col-span-4 sm:col-span-2">
        <p class="text-xs uppercase tracking-wide text-slate-500">Subtotale</p>
        <p class="mt-1 text-sm font-semibold text-white">
          {{ subtotal | currency: 'EUR' : 'symbol' : '1.2-2' : 'it' }}
        </p>
      </div>

      <div class="col-span-4 sm:col-span-1 flex items-end justify-end">
        <button
          type="button"
          (click)="remove.emit(index())"
          aria-label="Rimuovi riga"
          class="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10"
        >
          ✕
        </button>
      </div>
    </div>
  `,
})
export class OrderItemRowComponent {
  /**
   * FormGroup che rappresenta questa singola riga.
   * Lo crea e lo possiede il padre; qui lo passiamo solo a [formGroup].
   */
  readonly group = input.required<FormGroup>();

  /** Indice della riga nel FormArray padre (per `removeAt`). */
  readonly index = input.required<number>();

  /** Catalogo prodotti per il dropdown. */
  readonly products = input.required<Product[]>();

  /** Evento di rimozione. Payload: l'indice della riga. */
  readonly remove = output<number>();

  /**
   * Subtotale calcolato leggendo i valori correnti del FormGroup.
   *
   * Getter (non `computed`) perche' il FormGroup e' un oggetto mutabile:
   * il suo riferimento non cambia, quindi un computed che dipende solo
   * da `group()` non si ri-eseguirebbe ai cambi di qty/price.
   * Il template viene comunque rivalutato a ogni valueChanges grazie
   * a FormGroupDirective, che fa `markForCheck` anche con OnPush.
   */
  protected get subtotal(): number {
    const v = this.group().value as Partial<OrderItemFormShape>;
    const qty = Number(v.qty) || 0;
    const price = Number(v.price) || 0;
    return qty * price;
  }

  /**
   * Quando l'utente seleziona un prodotto dal dropdown, denormalizziamo
   * `name` e `price` nel FormGroup: cosi al submit l'OrderItem porta
   * con se' la "fotografia" del prodotto al momento dell'acquisto.
   */
  protected onProductChange(event: Event): void {
    const productId = (event.target as HTMLSelectElement).value;
    const product = this.products().find((p) => p.id === productId);
    if (product) {
      this.group().patchValue({
        name: product.name,
        price: product.price,
      });
    } else {
      // utente ha rimesso "Seleziona un prodotto": azzero i campi denormalizzati
      this.group().patchValue({ name: '', price: 0 });
    }
  }
}
