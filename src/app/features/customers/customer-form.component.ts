import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Customer } from '../../core/models/customer.model';
import { CustomerService } from '../../core/services/customer.service';

/**
 * Modalita del form: 'new' (POST) oppure 'edit' (PUT).
 */
type FormMode = 'new' | 'edit';

/**
 * CustomerFormComponent — form di creazione e modifica cliente (Bonus C).
 *
 * Stesso pattern di OrderFormComponent ma molto piu' snello: solo due
 * campi (name + email) e nessun FormArray.
 *
 *  - NonNullableFormBuilder per controlli tipizzati senza | null
 *  - validatori built-in: Validators.required, Validators.email
 *  - modalita dedotta da ActivatedRoute.paramMap (`:id` presente = edit)
 *  - in 'edit': fetch + patchValue + markAsPristine
 *  - dopo submit: redirect a `/customers`
 *  - in 'new': id generato lato client con `crypto.randomUUID()`
 */
@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-white">
          {{ mode() === 'new' ? 'Nuovo cliente' : 'Modifica cliente' }}
        </h2>
        <a
          routerLink="/customers"
          class="rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          ← Torna alla lista
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

        <div>
          <label for="email" class="block text-xs uppercase tracking-wide text-slate-500">
            Email
          </label>
          <input
            id="email"
            type="email"
            formControlName="email"
            class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          @if (showError('email')) {
            <small class="mt-1 block text-xs text-red-400">
              @if (form.controls.email.errors?.['required']) {
                Email obbligatoria.
              } @else if (form.controls.email.errors?.['email']) {
                Inserisci un'email valida.
              }
            </small>
          }
        </div>

        <footer class="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
          <a
            routerLink="/customers"
            class="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Annulla
          </a>
          <button
            type="submit"
            [disabled]="form.invalid || submitting()"
            class="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {{ mode() === 'new' ? 'Crea cliente' : 'Salva modifiche' }}
          </button>
        </footer>
      </form>
    </section>
  `,
})
export class CustomerFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customerService = inject(CustomerService);

  protected readonly mode = signal<FormMode>('new');
  protected readonly editingId = signal<string | null>(null);
  protected readonly submitting = signal(false);

  /**
   * FormGroup con due campi.
   *
   * `Validators.email` accetta anche stringa vuota: per renderlo
   * obbligatorio lo combiniamo con `Validators.required`.
   */
  protected readonly form = this.fb.group({
    name: this.fb.control('', Validators.required),
    email: this.fb.control('', [Validators.required, Validators.email]),
  });

  /**
   * Mostra errori di un campo solo dopo che l'utente lo ha toccato
   * o sporcato. Evita di urlare al primo render.
   */
  protected showError(name: 'name' | 'email'): boolean {
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
          this.loadCustomer(id);
        } else {
          this.mode.set('new');
          this.editingId.set(null);
        }
      });
  }

  private loadCustomer(id: string): void {
    this.customerService
      .getById(id)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (customer) => {
          this.form.patchValue({
            name: customer.name,
            email: customer.email,
          });
          this.form.markAsPristine();
        },
        error: (err) => {
          console.error('[CustomerForm] errore caricamento cliente:', err);
          this.router.navigate(['/customers']);
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
      const customer: Customer = {
        id: this.editingId()!,
        name: value.name,
        email: value.email,
      };

      this.customerService.update(customer).subscribe({
        next: () => this.router.navigate(['/customers']),
        error: () => this.submitting.set(false),
      });
    } else {
      const customer: Customer = {
        id: crypto.randomUUID(),
        name: value.name,
        email: value.email,
      };

      this.customerService.create(customer).subscribe({
        next: () => this.router.navigate(['/customers']),
        error: () => this.submitting.set(false),
      });
    }
  }
}
