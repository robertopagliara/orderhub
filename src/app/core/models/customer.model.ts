/**
 * Cliente anagrafico.
 * In Sprint 1 useremo solo `id` per referenziarlo dagli ordini;
 * verrà esteso negli sprint successivi (telefono, indirizzo, ecc.).
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
}
