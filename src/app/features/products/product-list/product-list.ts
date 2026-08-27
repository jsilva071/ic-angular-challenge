import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ProductsService } from '../../../core/api/products.service';
import { LocalProductsStore } from '../../../core/state/local-products.store';
import { AsyncState } from '../../../shared/ui/async-state/async-state';
import { ProductCard } from '../components/product-card/product-card';

const ALL_CATEGORIES = 'all';

@Component({
  selector: 'app-product-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncState, ProductCard],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList {
  private readonly products = inject(ProductsService);
  private readonly localProducts = inject(LocalProductsStore);

  private readonly productsQuery = this.products.getProducts();
  protected readonly query = this.productsQuery.result;

  protected readonly search = signal('');
  protected readonly category = signal(ALL_CATEGORIES);
  protected readonly allCategories = ALL_CATEGORIES;

  // Session-created products first, then the server catalog (de-duplicated).
  private readonly data = computed(() => {
    const server = this.query().data ?? [];
    const serverIds = new Set(server.map((p) => p.id));
    const local = this.localProducts.products().filter((p) => !serverIds.has(p.id));
    return [...local, ...server];
  });

  protected readonly totalCount = computed(() => this.data().length);

  protected readonly categories = computed(() => [
    ALL_CATEGORIES,
    ...Array.from(new Set(this.data().map((p) => p.category))).sort(),
  ]);

  protected readonly visibleProducts = computed(() => {
    const term = this.search().trim().toLowerCase();
    const category = this.category();

    return this.data().filter((product) => {
      const matchesCategory = category === ALL_CATEGORIES || product.category === category;
      const matchesTerm =
        term === '' ||
        product.title.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
  });

  protected readonly isFiltering = computed(
    () => this.search().trim() !== '' || this.category() !== ALL_CATEGORIES,
  );

  protected onSearch(value: string): void {
    this.search.set(value);
  }

  protected onCategory(value: string): void {
    this.category.set(value);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.category.set(ALL_CATEGORIES);
  }

  protected refetch(): void {
    this.query().refetch();
  }
}
