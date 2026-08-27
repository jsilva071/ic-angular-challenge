import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'products',
  },
  {
    path: 'products',
    title: 'Product Catalog',
    loadComponent: () =>
      import('./features/products/product-list/product-list').then((m) => m.ProductList),
  },
  {
    // Must precede ':id' so "new" is not parsed as a product id.
    path: 'products/new',
    title: 'Add a product · Product Catalog',
    loadComponent: () =>
      import('./features/products/product-form/product-form').then((m) => m.ProductForm),
  },
  {
    path: 'products/:id',
    title: 'Product details · Product Catalog',
    loadComponent: () =>
      import('./features/products/product-detail/product-detail').then((m) => m.ProductDetail),
  },
  {
    path: '**',
    title: 'Page not found · Product Catalog',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
