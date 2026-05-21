import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Barra di navigazione principale.
 * Espone tre link verso le aree feature: ordini, prodotti, clienti.
 *
 * `routerLinkActive` aggiunge automaticamente le classi CSS al link
 * della rotta correntemente attiva (visual feedback all'utente).
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
        </ul>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  protected readonly links = [
    { path: '/orders', label: 'Ordini' },
    { path: '/products', label: 'Prodotti' },
    { path: '/customers', label: 'Clienti' },
  ];
}
