import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';

/**
 * Configurazione di bootstrap di OrderHub.
 *
 * - `provideRouter` registra il routing definito in app.routes.ts
 * - `provideHttpClient` abilita HttpClient (con `withFetch` per usare l'API fetch nativa)
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
  ],
};
