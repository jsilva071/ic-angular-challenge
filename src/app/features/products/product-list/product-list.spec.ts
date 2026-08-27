import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ProductList } from './product-list';
import { PRODUCTS } from '../../../../testing/product.fixtures';
import { provideQueryTesting, settle } from '../../../../testing/query-testing';

const CATALOG_URL = 'https://fakestoreapi.com/products';

describe('ProductList', () => {
  let fixture: ComponentFixture<ProductList>;
  let httpMock: HttpTestingController;

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function type(selector: string, value: string, event = 'input') {
    const field = el().querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
    field.value = value;
    field.dispatchEvent(new Event(event));
  }

  async function loadCatalog() {
    httpMock.expectOne(CATALOG_URL).flush(PRODUCTS);
    await settle(fixture);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideQueryTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(ProductList);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    httpMock.verify();
  });

  it('shows a loading state before data arrives', () => {
    expect(el().textContent).toContain('Loading products…');
    httpMock.expectOne(CATALOG_URL).flush(PRODUCTS);
  });

  it('renders a card per product once loaded', async () => {
    await loadCatalog();

    expect(el().querySelectorAll('app-product-card')).toHaveLength(PRODUCTS.length);
    expect(el().textContent).toContain(`Showing ${PRODUCTS.length} of ${PRODUCTS.length} products`);
  });

  it('filters by search term', async () => {
    await loadCatalog();

    type('#search', 'ring');
    await settle(fixture);

    const cards = el().querySelectorAll('app-product-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toContain('Gold ring');
  });

  it('filters by category', async () => {
    await loadCatalog();

    type('#category', 'electronics', 'change');
    await settle(fixture);

    expect(el().querySelectorAll('app-product-card')).toHaveLength(1);
    expect(el().textContent).toContain('SSD drive');
  });

  it('shows an empty state when filters match nothing', async () => {
    await loadCatalog();

    type('#search', 'zzznomatch');
    await settle(fixture);

    expect(el().textContent).toContain('No products match your filters');
  });

  it('surfaces an error state with a retry action', async () => {
    httpMock.expectOne(CATALOG_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    await settle(fixture);

    expect(el().textContent).toContain("Couldn't load the catalog");
    expect(el().querySelector('button')?.textContent).toContain('Try again');
  });
});
