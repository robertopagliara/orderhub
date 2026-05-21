import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, of } from 'rxjs';

import { User } from '../models/user.model';

/**
 * Snapshot dell'utente loggato (esposto come signal readonly).
 * Estratto da User togliendo la password: il componente non deve
 * mai vedere la password (e in produzione non arriverebbe nemmeno).
 */
export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

/**
 * AuthService - autenticazione mock contro json-server (Bonus B).
 *
 * Stato esposto:
 *  - `isLoggedIn()` -> computed boolean
 *  - `currentUser()` -> AuthUser | null (signal readonly)
 *  - `role()` -> 'admin' | 'user' | null (computed)
 *
 * Pattern signal-based per consumo reattivo da template e altri service.
 * Stato persistito su localStorage cosi una refresh non perde la sessione.
 *
 * NB: questa e' un'implementazione DIDATTICA. In produzione si usa
 * un backend reale che restituisce un JWT, gestione token, refresh, ecc.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/users';
  private readonly storageKey = 'orderhub.auth';

  /**
   * Signal interno con l'utente corrente.
   * Inizializzato da localStorage per persistere la sessione tra refresh.
   */
  private readonly _currentUser = signal<AuthUser | null>(
    this.readFromStorage(),
  );

  /**
   * Utente corrente in lettura. I componenti chiamano `currentUser()`.
   * `asReadonly()` impedisce a chi consuma di chiamare `.set()`.
   */
  readonly currentUser = this._currentUser.asReadonly();

  /** True se c'e' un utente loggato. */
  readonly isLoggedIn = computed(() => this._currentUser() !== null);

  /** Ruolo dell'utente corrente, o null se non loggato. */
  readonly role = computed(() => this._currentUser()?.role ?? null);

  /**
   * Tenta il login con le credenziali fornite.
   *
   * Filtra gli utenti di json-server via query params, poi confronta
   * la password in modo case-sensitive. Se matcha, setta lo state e
   * salva su localStorage. Altrimenti emette `false`.
   *
   * @param username - Username inserito dall'utente.
   * @param password - Password inserita dall'utente.
   * @returns Observable<boolean> true se le credenziali sono valide.
   */
  login(username: string, password: string): Observable<boolean> {
    return this.http
      .get<User[]>(this.baseUrl, { params: { username } })
      .pipe(
        map((users) => {
          const match = users.find((u) => u.password === password);
          if (!match) {
            return false;
          }
          const auth: AuthUser = {
            id: match.id,
            username: match.username,
            role: match.role,
          };
          this._currentUser.set(auth);
          this.writeToStorage(auth);
          return true;
        }),
      );
  }

  /**
   * Disconnette l'utente: pulisce signal e localStorage.
   * Ritorna un Observable<void> per coerenza con la firma "async"
   * tipica del logout (in app reali si fa una chiamata al backend).
   */
  logout(): Observable<void> {
    this._currentUser.set(null);
    this.writeToStorage(null);
    return of(undefined);
  }

  /**
   * Legge lo state precedente da localStorage al boot.
   * Best-effort: se il JSON e' corrotto torniamo null e proseguiamo.
   */
  private readFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }

  /**
   * Persiste lo state corrente su localStorage (o lo cancella).
   */
  private writeToStorage(user: AuthUser | null): void {
    if (user) {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.storageKey);
    }
  }
}
