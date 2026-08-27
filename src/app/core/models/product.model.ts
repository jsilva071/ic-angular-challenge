/**
 * Domain model for the Fake Store API product resource.
 * @see https://fakestoreapi.com/docs
 */
export interface ProductRating {
  /** Average score, 0–5. */
  readonly rate: number;
  /** Number of ratings submitted. */
  readonly count: number;
}

export interface Product {
  readonly id: number;
  readonly title: string;
  readonly price: number;
  readonly description: string;
  readonly category: string;
  readonly image: string;
  readonly rating: ProductRating;
}

/**
 * Payload accepted by `POST /products`. The API assigns `id` and does not
 * store `rating`, so both are omitted from the client-side create model.
 */
export type NewProduct = Omit<Product, 'id' | 'rating'>;
