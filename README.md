# Product Catalog Challenge

## Task

Build a Product Catalog Single Page Application (SPA) for browsing and managing products. You will use the **Fake Store API** https://fakestoreapi.com/ as your data source.

### Requirements:

- **Overview Page:** Implement an overview page that displays a list of products with their title, image, price, and a truncated description.
- **Detail Page:** Implement a product detail page that shows the complete product information (full description, category, ratings, etc.).
- **Product Creation:** Create a form to simulate adding a new product to the catalog.
- **Best Practices:** Consider UX best practices, accessibility, and web semantics. It doesn't have to look incredibly fancy, but it should be clean and highly usable.
- **Getting Started:** Use the pre-configured `@ngneat/query` setup to manage your API state efficiently.

---

## What We Look For

This challenge is not about racing to finish every single requirement; it's about showing us how you work, how you think, and what you value as an engineer. **Please invest no more than 2 to 3 hours of your time.**

Please organize, design, test, and document your solution the way you normally would in a production environment. We understand that this timeline requires trade-offs.

The use of AI is mandatory, but the ownership of every technical decision is yours.

### Documentation Requirement:

Please use the bottom of this README to document:

- Your technical trade-offs and the rationale behind your choices.
- What you would do differently, or what you would focus on next if you had more time (e.g., specific architectural improvements, edge-case testing, advanced UI features).

---

## Submission

Clone this repo and send us the link to your repository when you are finished. This should be completed at least **24 hours before your scheduled interview**. We will walk through your codebase and discuss your solution together during the interview.

---

## Helpful Links

- [Fake Store API Docs](https://fakestoreapi.com/docs)
- [@ngneat/query Documentation](https://github.com/ngneat/query)
- [Angular Documentation](https://angular.dev/)

---

## Development & Tooling

This project was generated using Angular CLI version 21.2.11.

### Prerequisites

- Node.js 20+ (developed on Node 22)
- npm 10+

### Install & run

```bash
npm install
npm start          # dev server on http://localhost:4200
```

### Other scripts

```bash
npm run build        # production build
npm run test:ci      # run the unit tests once (Vitest via @angular/build:unit-test)
npm test             # tests in watch mode
npm run format       # apply Prettier
npm run format:check # verify formatting
```

---

## Solution Overview

### Routes

| Path             | Page                    | Notes                                              |
| ---------------- | ----------------------- | -------------------------------------------------- |
| `/products`      | Catalog / overview      | Grid, client-side search + category filter         |
| `/products/new`  | Create product form     | Reactive form, simulated `POST`                    |
| `/products/:id`  | Product detail          | Full info, rating, invalid-id + not-found handling |
| `**`             | Not found               |                                                    |

All routes are lazy-loaded standalone components.

### Structure

```
src/app/
  core/
    api/
      api.config.ts            # API_BASE_URL injection token
      products.service.ts      # all @ngneat/query queries + the create mutation
    models/product.model.ts    # Product, NewProduct
    state/local-products.store.ts  # signal store for session-created products
  features/
    products/
      product-list/            # overview page
      product-detail/          # detail page
      product-form/            # create page
      components/
        product-card/          # presentational card
        star-rating/           # accessible read-only rating
    not-found/
  shared/
    ui/async-state/            # shared loading / error surface
  testing/                     # test fixtures + @ngneat/query test helpers
```

### Key decisions in brief

- **`ProductsService` is the only place that talks to `@ngneat/query`.** Components consume signals (`query.result`, `mutation.result`) and never see `HttpClient` or query keys. One owner for the cache, one place to change the API contract.
- **Server state vs. UI state are separated.** `@ngneat/query` owns fetched data; local component `signal`s own search term, selected category, form submission state.
- **Zoneless + OnPush + signals throughout**, matching the Angular 21 scaffold (no `zone.js`).
- **Accessibility is built in, not bolted on:** semantic landmarks, a skip link, labelled controls with `aria-invalid` / `aria-describedby`, `role="alert"` for errors, `aria-live` for async status, focus moved to the first invalid field on submit, full-card click implemented without trapping keyboard users.

---

# Technical Trade-offs & Rationale

### 1. Simulated product creation — a session store instead of faking persistence

`POST /products` on the Fake Store API returns a new `id` but **does not persist anything** and **omits `rating`** from the echoed object. Three options:

1. `queryClient.setQueryData(['products'], …)` to splice the new item into the cached list.
2. Invalidate `['products']` and let it refetch.
3. Keep session creations in a small client-side store, merged into query results.

I went with **(3)** (`LocalProductsStore`, a signal store). (1) breaks the moment the list hasn't been fetched yet (you end up with a "catalog" of one product marked fresh), and (2) makes the new product vanish on the next refetch. The store gives predictable behaviour: the new product shows at the top of the catalog and on its own detail page, survives catalog refetches, and is clearly session-scoped (gone on hard reload) rather than pretending the backend saved it. The service still normalises the response (defaulting `rating` to `{ rate: 0, count: 0 }`) so the rest of the UI can trust the `Product` type.

### 2. `@ngneat/query` v3 options are not reactive

The library's `injectQuery({...})` takes a plain options object, not a reactive one. For the detail page, where the `:id` route param can change while the component instance is reused, I create the query once (disabled, with a placeholder id) and call `result.updateOptions(...)` from an `effect` keyed on the route input. It works and is contained in one place, but it's more ceremony than `injectQuery(() => ({ … }))` would be. Documented as a rough edge.

### 3. Queries created in the root service, not per-component

Following the documented `@ngneat/query` pattern, `injectQuery()` is called in the `ProductsService` field initializer, so query observers are tied to the root injector rather than a component's lifecycle. For an app this size that's fine (and matches the library's examples). At scale I'd want observers scoped to the consuming component so they're torn down on navigation.

### 4. Plain SCSS with design tokens, no component library

The brief says "clean and highly usable", not "fancy". A token file (`src/styles.scss`) plus small component stylesheets keeps the bundle lean, avoids a large dependency and its theming learning curve, and keeps full control over accessibility details. Light and dark themes are handled with `prefers-color-scheme`. The cost: I'm hand-rolling focus states, form styling, and layout that a library would give for free.

### 5. Client-side search and category filtering

The API has no meaningful search endpoint (only `?limit` / `?sort` and a per-category route). With ~20 products, fetching once and filtering in `computed` signals is simpler, instant, and offline-friendly. This does **not** scale — see below.

### 6. Testing focus

30 tests across the meaningful units:

- `ProductsService` — request URLs, query-key scoping, the invalid-id guard, and create → normalise → store (`HttpTestingController`).
- `star-rating` — half-star rounding, clamping, accessible label.
- `product-card` — rendering, currency formatting, decorative-image `alt`.
- `product-list` — loading / error / empty states, search and category filtering (integration-style, real service + mocked HTTP).
- `product-detail` — loaded product, invalid id, not-found, session-store fallback.
- `product-form` — validation gating, trimmed payload, success + error banners, navigation.

I prioritised behaviour that would actually regress over line coverage. `src/testing/` holds fixtures and a `@ngneat/query` test-provider + `settle()` helper (TanStack batches notifications on a macrotask, which the zoneless `TestBed` doesn't await on its own).

---

# What I'd Do Next (with more time)

**Architecture**

- Scope query observers to components instead of the root service; wrap `@ngneat/query` in a thin reactive adapter so `updateOptions`/`effect` plumbing disappears from the detail page.
- Add an HTTP interceptor for centralised error normalisation, retry/backoff policy, and a correlation id.
- Route-level data prefetching / SSR (`@angular/ssr`) for real first-paint and SEO on the detail pages.
- A typed API layer validated at the boundary (e.g. `zod`) so a contract change surfaces as a type error, not a runtime `undefined`.

**UX / features**

- Server-driven pagination or infinite scroll (`injectInfiniteQuery`) with URL-synced filters (`?q=`, `?category=`), so state is shareable and back-button-friendly.
- Debounced search input; skeleton loaders instead of a spinner; optimistic UI with rollback on the create mutation.
- Edit and delete flows; image upload with preview and dimension/size validation instead of a raw URL field.
- `@defer` for below-the-fold content; responsive `srcset` images; a real empty/error illustration set.

**Quality**

- ESLint + `angular-eslint` + Prettier in CI, plus a GitHub Actions workflow (install → format:check → test:ci → build).
- Playwright end-to-end coverage of the three core journeys.
- Accessibility regression tests (`axe-core`) and a visual-regression check for the card grid.
- Bundle-budget tuning and a Lighthouse CI gate.

**Edge cases I'd harden**

- Network offline / slow-3G behaviour and request cancellation on rapid navigation.
- Malformed API items (missing `rating`, negative price, huge strings) rendered defensively rather than trusting the type.
- Very long titles/descriptions, non-Latin text, and currency/locale handling (currently hard-coded `USD` / `en-US`).
