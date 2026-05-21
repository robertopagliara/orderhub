import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

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
 * Riceve il `FormGroup` figlio del FormArray padre e l'indice della
 * riga; emette `remove` quando l'utente clicca il bottone di rimozione.
 *
 * IMPORTANTE: il componente NON crea il FormGroup; lo crea il padre
 * (OrderFormComponent) e glielo passa via input. Cosi tutta la
 * costruzione del form resta centralizzata.
 *
 * `ChangeDetectionStrategy.OnPush`: cambia solo quando cambia il
 * riferimento del FormGroup in input o quando un signal letto dentro
 * il template cambia.
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
      <div class="col-span-12 sm:col-span-3">
        <label class="block text-xs uppercase tracking-wide text-slate-500">
          Product ID
        </label>
        <input
          type="text"
          formControlName="productId"
          class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
        />
      </div>

      <div class="col-span-12 sm:col-span-5">
        <label class="block text-xs uppercase tracking-wide text-slate-500">
          Nome
        </label>
        <input
          type="text"
          formControlName="name"
          class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
        />
      </div>

      <div class="col-span-4 sm:col-span-1">
        <label class="block text-xs uppercase tracking-wide text-slate-500">
          Q.ta
        </label>
        <input
          type="number"
          min="1"
          formControlName="qty"
          class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-right text-sm text-slate-100"
        />
      </div>

      <div class="col-span-4 sm:col-span-2">
        <label class="block text-xs uppercase tracking-wide text-slate-500">
          Prezzo
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          formControlName="price"
          class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-right text-sm text-slate-100"
        />
      </div>

      <div class="col-span-4 sm:col-span-1 flex flex-col items-end justify-end">
        <p class="text-xs uppercase tracking-wide text-slate-500">Subtotale</p>
        <p class="text-sm font-medium text-white">
          {{ subtotal() | currency: 'EUR' : 'symbol' : '1.2-2' : 'it' }}
        </p>
      </div>

      <div class="col-span-12 flex justify-end">
        <button
          type="button"
          (click)="remove.emit(index())"
          class="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10"
        >
          Rimuovi riga
        </button>
      </div>
    </div>
  `,
})
export class OrderItemRowComponent {
  /**
   * FormGroup che rappresenta questa singola riga.
   * Lo crea e lo possiede il padre (OrderFormComponent); qui lo
   * passiamo solo a [formGroup] per fare il binding con gli input.
   *
   * Lo tipiamo come `FormGroup` generico per restare flessibili: i
   * controlli specifici sono accessibili via formControlName nel template.
   */
  readonly group = input.required<FormGroup>();

  /**
   * Indice della riga nel FormArray padre. Serve al padre per fare
   * `removeAt(index)` quando la riga viene rimossa.
   */
  readonly index = input.required<number>();

  /**
   * Evento emesso al click su "Rimuovi riga". Payload: l'indice della
   * riga, che il padre usa per fare `formArray.removeAt(index)`.
   */
  readonly remove = output<number>();

  /**
   * Subtotale calcolato in tempo reale leggendo i valori correnti
   * del FormGroup. Reagisce ai cambi dei controlli qty e price.
   *
   * NB: leggiamo `group().value` come computed; ma poiche e' un valore
   * di FormGroup classico (non un signal nativo), il computed si
   * aggiorna a ogni change detection del componente. Per ricalcoli
   * piu' fini si potrebbero convertire i valueChanges in signal con
   * `toSignal` (M8). Per il LAB resta semplice.
   */
  protected readonly subtotal = computed(() => {
    const v = this.group().value as Partial<OrderItemFormShape>;
    const qty = Number(v.qty) || 0;
    const price = Number(v.price) || 0;
    return qty * price;
  });
}
