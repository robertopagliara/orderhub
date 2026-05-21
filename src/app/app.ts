import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

/**
 * App - shell dell'applicazione OrderHub.
 *
 * Inserisce una sola volta nel DOM gli elementi globali:
 *  - NavbarComponent (link feature)
 *  - SpinnerComponent (overlay durante chiamate HTTP, Bonus A)
 *  - ToastContainerComponent (notifiche errori e successi, Bonus A)
 *
 * Sotto al `<router-outlet />` vivono i componenti delle route attive.
 */
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    SpinnerComponent,
    ToastContainerComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('orderhub-solution');
}
