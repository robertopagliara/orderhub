import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * NavbarComponent - barra di navigazione globale.
 *
 * Link alle aree feature (ordini, prodotti, clienti) + area auth a destra
 * (Bonus B): mostra l'utente loggato con bottone Logout, oppure il link
 * "Accedi" se nessuno e' autenticato.
 *
 * `routerLinkActive` aggiunge la classe `text-red-500` al link attivo
 * per feedback visivo immediato.
 */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="border-b border-slate-800 bg-slate-950">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a routerLink="/" class="text-xl font-bold">
          <span class="text-red-500">Order</span>Hub
        </a>

        <ul class="flex items-center gap-6 text-sm font-medium">
          @for (link of links; track link.path) {
            <li>
              <a
                [routerLink]="link.path"
                routerLinkActive="text-red-500"
                class="text-slate-300 transition hover:text-white"
              >
                {{ link.label }}
              </a>
            </li>
          }

          <!-- Sezione auth (Bonus B) -->
          <li class="border-l border-slate-800 pl-6">
            @if (auth.currentUser(); as user) {
              <div class="flex items-center gap-3">
                <span class="text-slate-400">
                  Ciao, <strong class="text-slate-100">{{ user.username }}</strong>
                  <span class="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs uppercase">
                    {{ user.role }}
                  </span>
                </span>
                <button
                  type="button"
                  (click)="onLogout()"
                  class="rounded-md border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  Logout
                </button>
              </div>
            } @else {
              <a
                routerLink="/login"
                class="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
              >
                Accedi
              </a>
            }
          </li>
        </ul>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly links = [
    { path: '/orders', label: 'Ordini' },
    { path: '/products', label: 'Prodotti' },
    { path: '/customers', label: 'Clienti' },
  ];

  /**
   * Handler del click su Logout.
   * Pulisce lo state e mostra un toast informativo, poi naviga a /orders.
   */
  protected onLogout(): void {
    this.auth.logout().subscribe(() => {
      this.toast.show('Logout effettuato.', 'info');
      this.router.navigate(['/orders']);
    });
  }
}
