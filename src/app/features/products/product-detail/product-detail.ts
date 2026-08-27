import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../../core/api/products.service';
import { LocalProductsStore } from '../../../core/state/local-products.store';
import { AsyncState } from '../../../shared/ui/async-state/async-state';
import { StarRating } from '../components/star-rating/star-rating';

@Component({
  selector: 'app-product-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink, AsyncState, StarRating],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
  private readonly products = inject(ProductsService);
  private readonly localProducts = inject(LocalProductsStore);

  /** `id` route parameter, bound via `withComponentInputBinding()`. */
  readonly id = input.required<string>();

  protected readonly productId = computed(() => Number(this.id()));

  protected readonly isInvalidId = computed(
    () => !Number.isFinite(this.productId()) || this.productId() <= 0,
  );

  // Created disabled; the effect below points it at the real id and keeps it in
  // sync when navigating straight between two detail pages.
  private readonly productQuery = this.products.getProduct(0);
  protected readonly query = this.productQuery.result;

  constructor() {
    effect(() => {
      this.productQuery.updateOptions(this.products.productByIdOptions(this.productId()));
    });
  }

  /** Server product, falling back to a session-created one. */
  protected readonly product = computed(
    () => this.query().data ?? this.localProducts.byId(this.productId()),
  );

  /** The request succeeded (or we are offline-resolving) but nothing matched. */
  protected readonly notFound = computed(
    () => !this.isInvalidId() && this.query().isSuccess && !this.product(),
  );

  protected readonly showError = computed(() => this.query().isError && !this.product());

  protected refetch(): void {
    this.query().refetch();
  }
}
