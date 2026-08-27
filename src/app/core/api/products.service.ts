import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { injectMutation, injectQuery, injectQueryClient } from '@ngneat/query';
import { API_BASE_URL } from './api.config';
import { NewProduct, Product } from '../models/product.model';
import { LocalProductsStore } from '../state/local-products.store';

/**
 * Single entry point for product server-state. All `@ngneat/query` wiring lives
 * here so components stay declarative and the cache/query keys have one owner.
 *
 * Query key convention:
 *   ['products']          -> the catalog list
 *   ['products', id]      -> a single product
 *   ['product-categories'] -> category list (used by the create form)
 */
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly query = injectQuery();
  private readonly mutation = injectMutation();
  private readonly queryClient = injectQueryClient();
  private readonly localProducts = inject(LocalProductsStore);

  /** All products in the catalog. */
  getProducts() {
    return this.query({
      queryKey: ['products'] as const,
      queryFn: () => this.http.get<Product[]>(`${this.baseUrl}/products`),
    });
  }

  /**
   * A single product. The options are also exposed via {@link productByIdOptions}
   * so callers can react to a changing id with `result.updateOptions(...)`
   * (`@ngneat/query` v3 options are not reactive on their own).
   */
  getProduct(id: number) {
    return this.query(this.productByIdOptions(id));
  }

  productByIdOptions(id: number) {
    return {
      queryKey: ['products', id] as const,
      queryFn: () => this.http.get<Product>(`${this.baseUrl}/products/${id}`),
      // Guards the placeholder id used before the route input resolves.
      enabled: Number.isFinite(id) && id > 0,
    };
  }

  /** Distinct product categories, used to populate the create form. */
  getCategories() {
    return this.query({
      queryKey: ['product-categories'] as const,
      queryFn: () => this.http.get<string[]>(`${this.baseUrl}/products/categories`),
    });
  }

  /**
   * Simulates adding a product. The Fake Store API echoes a created product with
   * a new id but does not persist it (and omits `rating`), so on success we
   * normalise the response and keep it in {@link LocalProductsStore} for the
   * session. We also seed the by-id cache so the detail page needs no request.
   */
  createProduct() {
    return this.mutation({
      mutationFn: (product: NewProduct) =>
        this.http.post<Partial<Product>>(`${this.baseUrl}/products`, product),
      onSuccess: (response: Partial<Product>, product: NewProduct) => {
        const created: Product = {
          id: response.id ?? Date.now(),
          title: response.title ?? product.title,
          price: response.price ?? product.price,
          description: response.description ?? product.description,
          category: response.category ?? product.category,
          image: response.image ?? product.image,
          rating: response.rating ?? { rate: 0, count: 0 },
        };

        this.localProducts.add(created);
        this.queryClient.setQueryData<Product>(['products', created.id], created);
      },
    });
  }
}
