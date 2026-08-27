import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ProductDetail } from './product-detail';
import { LocalProductsStore } from '../../../core/state/local-products.store';
import { makeProduct } from '../../../../testing/product.fixtures';
import { provideQueryTesting, settle } from '../../../../testing/query-testing';

describe('ProductDetail', () => {
  let fixture: ComponentFixture<ProductDetail>;
  let httpMock: HttpTestingController;

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function createWithId(id: string) {
    fixture = TestBed.createComponent(ProductDetail);
    fixture.componentRef.setInput('id', id);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideQueryTesting(), provideRouter([])],
    });
  });

  afterEach(() => {
    fixture.destroy();
    httpMock.verify();
  });

  it('renders the full product once loaded', async () => {
    createWithId('1');
    httpMock.expectOne('https://fakestoreapi.com/products/1').flush(makeProduct({ id: 1 }));
    await settle(fixture);

    expect(el().querySelector('h1')?.textContent).toContain('Fjallraven');
    expect(el().textContent).toContain('Description');
    expect(el().querySelector('img')?.getAttribute('alt')).toContain('Fjallraven');
  });

  it('rejects a non-numeric id without calling the API', async () => {
    createWithId('abc');
    await settle(fixture);

    expect(el().textContent).toContain('Invalid product');
    httpMock.expectNone(() => true);
  });

  it('shows a not-found message when the product does not exist', async () => {
    createWithId('999');
    httpMock.expectOne('https://fakestoreapi.com/products/999').flush(null);
    await settle(fixture);

    expect(el().textContent).toContain('Product not found');
  });

  it('falls back to a session-created product when the API has none', async () => {
    TestBed.inject(LocalProductsStore).add(makeProduct({ id: 21, title: 'Session Item' }));
    createWithId('21');
    httpMock.expectOne('https://fakestoreapi.com/products/21').flush(null);
    await settle(fixture);

    expect(el().querySelector('h1')?.textContent).toContain('Session Item');
  });
});
