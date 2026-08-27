import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product.model';

/**
 * Holds products "created" during the session.
 *
 * The Fake Store API accepts `POST /products` but does not persist the result,
 * so a refetch of the catalog would never include it. Keeping session creations
 * in a small client-side store lets the new product appear consistently in the
 * list and on its detail page, and survive catalog refetches — without pretending
 * the backend saved it.
 */
@Injectable({ providedIn: 'root' })
export class LocalProductsStore {
  private readonly _products = signal<Product[]>([]);

  /** Session-created products, newest first. */
  readonly products = this._products.asReadonly();

  add(product: Product): void {
    this._products.update((current) => [product, ...current.filter((p) => p.id !== product.id)]);
  }

  byId(id: number): Product | undefined {
    return this._products().find((p) => p.id === id);
  }
}
