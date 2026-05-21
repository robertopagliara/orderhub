import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

/**
 * LoginComponent - form di autenticazione mock (Bonus B).
 *
 * Comportamento:
 *  - form reactive con username + password (entrambi required)
 *  - al submit chiama `authService.login(username, password)`
 *  - se le credenziali sono valide: redirect a `returnUrl` (query param)
 *    oppure alla home `/orders`
 *  - se non valide: toast d'errore + signal `errorMessage` settato
 *
 * `ChangeDetectionStrategy.OnPush` per performance: il form e i signal
 * notificano Angular quando devono ridisegnare.
 *
 * NB: per il corso accettiamo username/password in chiaro. In produzione
 * passerebbero in HTTPS verso un backend che gestisce auth reale.
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-md">
      <header class="mb-6">
        <h2 class="text-2xl font-bold text-white">Accedi a OrderHub</h2>
        <p class="text-sm text-slate-400">
          Credenziali demo:
          <code class="rounded bg-slate-800 px-1 py-0.5 text-xs">admin/admin</code>
          o
          <code class="rounded bg-slate-800 px-1 py-0.5 text-xs">user/user</code>.
        </p>
      </header>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        class="space-y-4 rounded-lg border border-slate-800 bg-slate-950/60 p-6"
      >
        <div>
          <label class="block text-xs uppercase tracking-wide text-slate-500"
            >Username</label
          >
          <input
            type="text"
            autocomplete="username"
            formControlName="username"
            class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          @if (showError('username')) {
            <small class="mt-1 block text-xs text-red-400">
              Username obbligatorio.
            </small>
          }
        </div>

        <div>
          <label class="block text-xs uppercase tracking-wide text-slate-500"
            >Password</label
          >
          <input
            type="password"
            autocomplete="current-password"
            formControlName="password"
            class="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          @if (showError('password')) {
            <small class="mt-1 block text-xs text-red-400">
              Password obbligatoria.
            </small>
          }
        </div>

        @if (errorMessage()) {
          <p class="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {{ errorMessage() }}
          </p>
        }

        <div class="flex items-center justify-between">
          <a
            routerLink="/orders"
            class="text-sm text-slate-400 hover:text-slate-200"
          >
            Torna agli ordini
          </a>
          <button
            type="submit"
            [disabled]="form.invalid || submitting()"
            class="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            Accedi
          </button>
        </div>
      </form>
    </section>
  `,
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  /**
   * FormGroup con username + password. NonNullableFormBuilder rende
   * i controlli tipizzati come `FormControl<string>` (no `| null`).
   */
  protected readonly form = this.fb.group({
    username: this.fb.control('', Validators.required),
    password: this.fb.control('', Validators.required),
  });

  /**
   * True se il controllo e' invalido e l'utente l'ha gia toccato.
   */
  protected showError(name: 'username' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  /**
   * Handler del submit. Chiama authService.login() e gestisce
   * l'esito navigando o mostrando l'errore.
   */
  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { username, password } = this.form.getRawValue();

    this.auth.login(username, password).subscribe({
      next: (ok) => {
        this.submitting.set(false);
        if (ok) {
          this.toast.show('Login effettuato', 'success');

          // legge la returnUrl dai query params, oppure default '/orders'
          const returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') ?? '/orders';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.errorMessage.set('Credenziali non valide.');
        }
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set(
          'Impossibile contattare il backend. Riprova piu tardi.',
        );
      },
    });
  }
}
