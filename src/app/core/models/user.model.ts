/**
 * Modello User per l'autenticazione mock (Bonus B).
 *
 * In produzione la password NON va mai esposta lato client: qui e'
 * presente solo perche json-server non implementa autenticazione vera
 * e ci serve un meccanismo per confrontare le credenziali nel mock.
 */
export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
}
