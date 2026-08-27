import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ProductForm } from './product-form';
import { provideQueryTesting, settle, tick } from '../../../../testing/query-testing';

const CREATE_URL = 'https://fakestoreapi.com/products';
const CATEGORIES_URL = 'https://fakestoreapi.com/products/categories';

describe('ProductForm', () => {
  let fixture: ComponentFixture<ProductForm>;
  let httpMock: HttpTestingController;

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function setValue(selector: string, value: string) {
    const field = el().querySelector<HTMLInputElement>(selector)!;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('change'));
  }

  function fillValidForm() {
    setValue('#title', 'A valid product title');
    setValue('#price', '19.99');
    setValue('#category', 'electronics');
    setValue('#image', 'https://example.com/image.jpg');
    setValue('#description', 'A description with enough characters.');
  }

  function submit() {
    el().querySelector<HTMLFormElement>('form')!.requestSubmit();
  }

  async function submitCreate(flushBody: Record<string, unknown>) {
    fillValidForm();
    await settle(fixture);
    submit();
    await tick();
    const req = httpMock.expectOne(CREATE_URL);
    req.flush(flushBody);
    await settle(fixture);
    return req;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideQueryTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(ProductForm);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne(CATEGORIES_URL).flush(['electronics']);
    await settle(fixture);
  });

  afterEach(() => {
    fixture.destroy();
    httpMock.verify();
  });

  it('blocks submission and shows errors when the form is empty', async () => {
    submit();
    await settle(fixture);

    expect(el().textContent).toContain('Title is required.');
    expect(el().textContent).toContain('Price is required.');
    expect(el().textContent).toContain('Please fix the highlighted fields.');
    httpMock.expectNone(CREATE_URL);
  });

  it('rejects an invalid image URL', async () => {
    fillValidForm();
    setValue('#image', 'not-a-url');
    submit();
    await settle(fixture);

    expect(el().textContent).toContain('Enter a valid http(s) URL.');
    httpMock.expectNone(CREATE_URL);
  });

  it('submits a trimmed payload and confirms success', async () => {
    fillValidForm();
    setValue('#title', '  Spaced title  ');
    await settle(fixture);

    submit();
    await tick();

    const req = httpMock.expectOne(CREATE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      title: 'Spaced title',
      price: 19.99,
      category: 'electronics',
      image: 'https://example.com/image.jpg',
      description: 'A description with enough characters.',
    });
    req.flush({ id: 21, ...(req.request.body as object) });
    await settle(fixture);

    expect(el().textContent).toContain('Product created');
    expect(el().textContent).toContain('id 21');
  });

  it('navigates to the created product on demand', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await submitCreate({ id: 99 });

    el()
      .querySelectorAll<HTMLButtonElement>('button')
      .forEach((b) => b.textContent?.includes('View product') && b.click());
    await settle(fixture);

    expect(navigate).toHaveBeenCalledWith(['/products', 99]);
  });

  it('shows an error banner when the request fails', async () => {
    fillValidForm();
    await settle(fixture);
    submit();
    await tick();
    httpMock.expectOne(CREATE_URL).flush('nope', { status: 500, statusText: 'Server Error' });
    await settle(fixture);

    expect(el().textContent).toContain("Couldn't create the product.");
  });
});
