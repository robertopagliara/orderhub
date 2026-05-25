/**
 * Prodotto a catalogo (settore elettronica nella soluzione di riferimento).
 *
 * Le righe ordine sono "denormalizzate": copiano name e price al momento
 * della creazione (vedi OrderItem). Il Product qui rappresenta il catalogo
 * vivo da cui l'utente sceglie nel form.
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}
