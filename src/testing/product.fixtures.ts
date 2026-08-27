import { Product } from '../app/core/models/product.model';

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    title: 'Fjallraven Foldsack No. 1 Backpack',
    price: 109.95,
    description: 'Your perfect pack for everyday use and walks in the forest.',
    category: "men's clothing",
    image: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg',
    rating: { rate: 3.9, count: 120 },
    ...overrides,
  };
}

export const PRODUCTS: Product[] = [
  makeProduct({ id: 1, title: 'Backpack', category: "men's clothing", price: 109.95 }),
  makeProduct({ id: 2, title: 'Gold ring', category: 'jewelery', price: 695 }),
  makeProduct({ id: 3, title: 'SSD drive', category: 'electronics', price: 64 }),
];
