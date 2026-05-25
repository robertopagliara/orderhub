import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * SidebarComponent — barra di navigazione verticale in stile CRM.
 *
 * Naviga tra le feature dell'app (ordini, prodotti, clienti) e ospita la
 * sezione auth in fondo (Bonus B) con username/role + bottone Logout.
 *
 * Visibilita:
 *  - utente NON loggato → il componente non emette nulla (`@if` esterno
 *    a tutto l'aside). La pagina di login resta accessibile via routing:
 *    `authGuard` reindirizza a `/login` qualsiasi rotta protetta, quindi
 *    senza nav comunque l'utente si trova davanti al form di login.
 *  - utente loggato → sidebar visibile in tutti i suoi stati.
 *
 * Comportamento collassabile (solo da loggati):
 *  - `isOpen()` = true  → sidebar larga (~14rem) con label e sezione auth
 *  - `isOpen()` = false → solo rail stretto (~3rem) con il bottone hamburger
 *  - lo stato e' un signal locale: il toggle vive dentro la sidebar
 *    e si attiva con un click sull'hamburger in alto
 *
 * Lo stesso comportamento vale su desktop e mobile: niente media query,
 * niente overlay con backdrop. Mantiene il codice didattico e leggibile.
 *
 * `routerLinkActive` evidenzia il link della rotta corrente colorando
 * sia lo sfondo che il testo: in una sidebar verticale e' piu' leggibile
 * di un semplice cambio colore e coerente con i CRM moderni.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (auth.currentUser(); as user) {
      <aside
        class="sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-800 bg-slate-950 transition-[width] duration-200"
        [class.w-56]="isOpen()"
        [class.w-14]="!isOpen()"
      >
        <!--
          Header della sidebar: hamburger (sempre visibile) + brand
          (solo quando aperta, altrimenti non ci sta nel rail stretto).
        -->
        <div class="flex items-center gap-3 border-b border-slate-800 px-3 py-4">
          <button
            type="button"
            (click)="toggle()"
            [attr.aria-label]="isOpen() ? 'Chiudi sidebar' : 'Apri sidebar'"
            [attr.aria-expanded]="isOpen()"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <span aria-hidden="true" class="text-lg leading-none">
              {{ isOpen() ? '×' : '☰' }}
            </span>
          </button>
          @if (isOpen()) {
            <a routerLink="/" class="whitespace-nowrap text-lg font-bold">
              <span class="text-red-500">Order</span>Hub
            </a>
          }
        </div>

        <!--
          Lista link feature. Nel rail stretto i link sono nascosti: lasciamo
          solo l'hamburger per mantenere l'UI essenziale (niente icone, come
          da scelta didattica).
        -->
        @if (isOpen()) {
          <nav class="flex-1 overflow-y-auto py-3">
            <ul class="space-y-1 px-2">
              @for (link of links; track link.path) {
                <li>
                  <a
                    [routerLink]="link.path"
                    routerLinkActive="bg-slate-800 text-red-500"
                    class="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>
          </nav>
        } @else {
          <div class="flex-1"></div>
        }

        <!--
          Sezione auth, ancorata in fondo grazie al flex-1 del nav sopra.
          Mostrata solo quando la sidebar e' aperta: nel rail stretto non c'e'
          spazio per username/role/bottone.
        -->
        @if (isOpen()) {
          <div class="border-t border-slate-800 p-3">
            <div class="space-y-2">
              <div class="text-sm">
                <p class="truncate font-medium text-slate-100">{{ user.username }}</p>
                <span class="mt-0.5 inline-block rounded-full bg-slate-800 px-2 py-0.5 text-xs uppercase text-slate-400">
                  {{ user.role }}
                </span>
              </div>
              <button
                type="button"
                (click)="onLogout()"
                class="w-full rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          </div>
        }
      </aside>
    }
  `,
})
export class SidebarComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /**
   * Stato espanso/collassato della sidebar.
   * Default: aperta. L'utente la chiude col bottone hamburger e lo stato
   * resta in memoria finche' la sessione del componente vive. Non lo
   * persistiamo su localStorage per non aggiungere complessita didattica.
   */
  protected readonly isOpen = signal(true);

  /** Elenco link feature mostrati nella sidebar. */
  protected readonly links = [
    { path: '/orders', label: 'Ordini' },
    { path: '/products', label: 'Prodotti' },
    { path: '/customers', label: 'Clienti' },
  ];

  /** Toggle dello stato espanso/collassato. */
  protected toggle(): void {
    this.isOpen.update((open) => !open);
  }

  /**
   * Handler del click su Logout.
   * Pulisce lo state, mostra un toast informativo e naviga a /orders.
   */
  protected onLogout(): void {
    this.auth.logout().subscribe(() => {
      this.toast.show('Logout effettuato.', 'info');
      this.router.navigate(['/orders']);
    });
  }
}
