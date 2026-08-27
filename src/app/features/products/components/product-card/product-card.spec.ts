import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ProductCard } from './product-card';
import { makeProduct } from '../../../../../testing/product.fixtures';

@Component({
  imports: [ProductCard],
  template: `<app-product-card [product]="product" />`,
})
class Host {
  product = makeProduct({
    id: 42,
    title: 'Test Backpack',
    price: 109.95,
    category: "men's clothing",
    description: 'A long description that the card should show in full text form.',
  });
}

describe('ProductCard', () => {
  function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the title as a link to the detail page', () => {
    const link = render().querySelector<HTMLAnchorElement>('.product-card__title a');
    expect(link?.textContent?.trim()).toBe('Test Backpack');
    expect(link?.getAttribute('href')).toBe('/products/42');
  });

  it('formats the price as USD currency', () => {
    expect(render().querySelector('.product-card__price')?.textContent).toContain('$109.95');
  });

  it('renders the category and description', () => {
    const el = render();
    expect(el.querySelector('.product-card__category')?.textContent?.trim()).toBe("men's clothing");
    expect(el.querySelector('.product-card__description')?.textContent).toContain(
      'A long description',
    );
  });

  it('uses an empty alt on the decorative image (title carries the name)', () => {
    expect(render().querySelector('img')?.getAttribute('alt')).toBe('');
  });
});
