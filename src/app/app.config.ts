import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';

import { routes } from './app.routes';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

/**
 * Configurazione di bootstrap di OrderHub.
 *
 * - `provideRouter` registra il routing definito in app.routes.ts
 * - `provideHttpClient` abilita HttpClient con:
 *   - `withFetch()`: usa l'API fetch nativa al posto di XHR
 *   - `withInterceptors([...])`: catena di interceptor funzionali
 *
 * Ordine degli interceptor:
 *  1. `loadingInterceptor` -> incrementa/decrementa il counter globale
 *  2. `errorInterceptor`   -> intercetta errori HTTP e li converte in toast
 *
 * L'ordine conta: il loading "avvolge" l'errorInterceptor cosi il counter
 * scende correttamente anche quando l'error interceptor ri-tira l'errore.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([loadingInterceptor, errorInterceptor]),
    ),
  ],
};
