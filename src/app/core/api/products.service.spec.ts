import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { filter, firstValueFrom } from 'rxjs';
import { injectQueryClient } from '@ngneat/query';
import { ProductsService } from './products.service';
import { API_BASE_URL } from './api.config';
import { LocalProductsStore } from '../state/local-products.store';
import { makeProduct, PRODUCTS } from '../../../testing/product.fixtures';
import { provideQueryTesting, tick } from '../../../testing/query-testing';

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideQueryTesting(), { provide: API_BASE_URL, useValue: 'https://api.test' }],
    });
    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads the catalog from GET /products', async () => {
    const query = TestBed.runInInjectionContext(() => service.getProducts());
    const success = firstValueFrom(query.result$.pipe(filter((r) => r.isSuccess)));

    const req = httpMock.expectOne('https://api.test/products');
    expect(req.request.method).toBe('GET');
    req.flush(PRODUCTS);

    expect((await success).data).toEqual(PRODUCTS);
  });

  it('loads a single product with an id-scoped query key', async () => {
    const query = TestBed.runInInjectionContext(() => service.getProduct(2));
    const success = firstValueFrom(query.result$.pipe(filter((r) => r.isSuccess)));

    httpMock.expectOne('https://api.test/products/2').flush(makeProduct({ id: 2 }));

    expect((await success).data?.id).toBe(2);
  });

  it('does not fetch when the product id is invalid', async () => {
    const query = TestBed.runInInjectionContext(() => service.getProduct(0));
    const sub = query.result$.subscribe();

    await tick();
    httpMock.expectNone(() => true);
    sub.unsubscribe();
  });

  it('posts new products and keeps a normalised copy for the session', async () => {
    const queryClient = TestBed.runInInjectionContext(() => injectQueryClient());
    const localProducts = TestBed.inject(LocalProductsStore);

    const mutation = TestBed.runInInjectionContext(() => service.createProduct());
    const payload = {
      title: 'New thing',
      price: 12.5,
      description: 'A brand new thing',
      category: 'electronics',
      image: 'https://example.com/x.jpg',
    };

    const done = mutation.mutateAsync(payload);
    await tick();

    const req = httpMock.expectOne('https://api.test/products');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    // API echoes the payload with an id but omits `rating`.
    req.flush({ id: 21, ...payload });
    await done;

    expect(localProducts.products()).toHaveLength(1);
    expect(localProducts.byId(21)).toEqual({ id: 21, ...payload, rating: { rate: 0, count: 0 } });
    expect(queryClient.getQueryData(['products', 21])).toMatchObject({ id: 21 });
  });
});
