/**
 * Stati possibili di un ordine.
 * Type union: TypeScript verifica a compile-time che vengano usati solo questi 4 valori.
 */
export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

/**
 * Singola riga di un ordine.
 * `productId` è il riferimento al prodotto, `name` e `price` sono "denormalizzati"
 * (copiati al momento dell'acquisto) perché un ordine deve restare immutabile
 * anche se il prodotto in catalogo cambia nome o prezzo in futuro.
 */
export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

/**
 * Ordine completo restituito da json-server.
 * `total` viene salvato già calcolato per evitare ricalcoli lato client su liste lunghe.
 */
export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: string;
}
