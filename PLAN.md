# Implementation Plan — Product Catalog

_Written before starting. Captures the intended approach, scope, and the trade-offs I expect to make inside the 2–3 hour budget._

## 1. Goal & scope

Build a Product Catalog SPA on top of the Fake Store API with three surfaces:

1. **Overview** — list of products (title, image, price, truncated description).
2. **Detail** — full product info (description, category, rating).
3. **Create** — a form that simulates adding a product.

Server state will go through the pre-configured `@ngneat/query`. The bar is "clean and highly usable" with real attention to accessibility and semantics — not visual polish.

### In scope

- The three pages above + a 404 route.
- Loading / error / empty states for every async view.
- Client-side search + category filter on the overview (the API has no real search).
- Reactive form with validation and a visible success/error result.
- Unit tests for the pieces that would actually regress.
- Documentation of trade-offs and next steps at the bottom of the README.

### Out of scope (documented, not built)

- Edit / delete flows.
- Server-side pagination / infinite scroll.
- Auth, SSR, i18n, image upload.
- E2E tests, visual regression, CI pipeline.

## 2. Architecture

Feature-first structure, standalone components, zoneless + signals (matching the Angular 21 scaffold — no `zone.js`).

```
src/app/
  core/
    api/
      api.config.ts          # API_BASE_URL injection token (per-env, test-overridable)
      products.service.ts     # ALL @ngneat/query queries + the create mutation
    models/product.model.ts   # Product, NewProduct
    state/                    # client-only UI/session state (see §4)
  features/
    products/
      product-list/           # overview page
      product-detail/         # detail page
      product-form/           # create page
      components/
        product-card/         # presentational card
        star-rating/          # accessible read-only rating
    not-found/
  shared/ui/                  # shared loading/error surface
  testing/                    # fixtures + @ngneat/query test helpers
```

**Principles I intend to hold to:**

- `ProductsService` is the only place that imports `@ngneat/query` / `HttpClient` / knows query keys. Components consume signals (`query.result`, `mutation.result`) and stay declarative.
- Separate **server state** (`@ngneat/query`) from **UI state** (local `signal`s: search term, selected category, submit state).
- One query-key convention: `['products']`, `['products', id]`, `['product-categories']`.
- `OnPush` everywhere; lazy-load each route with `loadComponent`.

## 3. Page-by-page approach

### Overview (`/products`)

- `getProducts()` query → grid of `ProductCard`.
- Search + category filter as `computed` signals over the fetched list (instant, offline-friendly; does not scale — noted).
- Truncation via CSS `line-clamp` so the full text stays in the DOM for assistive tech.
- Card: whole card clickable, but the `<a>` on the title carries the accessible name; decorative `<img>` gets empty `alt`.

### Detail (`/products/:id`)

- Route param via `withComponentInputBinding()`.
- `getProduct(id)` query. Guard non-numeric / non-positive ids before fetching.
- Handle "success but empty" (the API returns `null` for unknown ids) as an explicit not-found state.
- **Known rough edge:** `@ngneat/query` v3 options aren't reactive, so when the `:id` changes on a reused component I'll drive it with an `effect` + `result.updateOptions(...)`.

### Create (`/products/new`)

- Typed reactive form: `title`, `price`, `category` (select, populated from `getCategories()`), `image` (URL), `description`. Required + length/range validation, `min` price.
- `POST /products` mutation. On submit-invalid: mark touched, move focus to the first invalid field.
- On success: show a result banner with the new id and a link to the product.

## 4. The tricky bit: "simulate adding a product"

`POST /products` returns a new `id` but **does not persist** and **omits `rating`**. Options:

| Option                                           | Problem                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `setQueryData(['products'], …)` splice into list | Breaks if the list was never fetched (catalog of one, marked fresh) |
| Invalidate + refetch                             | New product vanishes on the next refetch                            |
| **Session store merged into query results**      | Extra concept, but predictable                                      |

**Plan:** a small signal-based `LocalProductsStore` holding session creations, merged (de-duplicated) into the overview list and used as a fallback on the detail page. The service normalises the response (default `rating` to `{ rate: 0, count: 0 }`) so the rest of the app can trust the `Product` type. Clearly session-scoped — gone on hard reload — rather than pretending the backend saved it.

## 5. Accessibility & semantics

- Landmark elements (`header` / `nav` / `main` / `footer`), a skip link, `main` focusable and focused on navigation.
- Form controls: real `<label for>`, `aria-invalid`, `aria-describedby` pointing at the error text, errors in `role="alert"`.
- Async status announced via `aria-live`; error surfaces use `role="alert"`.
- Visible `:focus-visible` styling on every interactive element; `prefers-reduced-motion` respected.
- Star rating exposes the precise value + rating count as an `aria-label` on a single `role="img"`.

## 6. Styling

Plain SCSS with a design-token file (`src/styles.scss`) + small per-component stylesheets. No component library — keeps the bundle lean and control total, at the cost of hand-rolling focus/form/layout. Light + dark via `prefers-color-scheme`. Currency via the built-in `CurrencyPipe` (hard-coded `USD` / `en-US` for now).

## 7. Testing

Vitest (via `@angular/build:unit-test`). Target the behaviour that would regress, not line coverage:

- `ProductsService` — request URLs, query-key scoping, invalid-id guard, create → normalise → store (`HttpTestingController`).
- `star-rating` — half-star rounding, clamping, accessible label.
- `product-card` — rendering, currency formatting, decorative-image `alt`.
- `product-list` — loading / error / empty, search + category filtering (real service, mocked HTTP).
- `product-detail` — loaded, invalid id, not-found, session-store fallback.
- `product-form` — validation gating, trimmed payload, success + error banners, navigation.

`src/testing/` holds fixtures and a `@ngneat/query` test-provider + a `settle()` helper (TanStack batches notifications on a macrotask that the zoneless `TestBed` won't await on its own).

## 8. Time budget (rough)

| Block                                                   | ~time  |
| ------------------------------------------------------- | ------ |
| Scaffolding: models, service, routes, app shell, tokens | 30 min |
| Overview page + card + star rating                      | 35 min |
| Detail page                                             | 25 min |
| Create form + mutation + session store                  | 40 min |
| Tests                                                   | 35 min |
| Browser QA + polish + README write-up                   | 25 min |

## 9. Expected trade-offs (to revisit in the README)

- Queries created in the root service (documented `@ngneat/query` pattern) → observers tied to the root injector, not component lifecycle. Fine at this size.
- `effect` + `updateOptions` on the detail page instead of reactive query options.
- Client-side search/filter — won't scale past a small catalog.
- No lint/CI in the timebox; formatting via Prettier only.

## 10. If I had more time (headline items)

- Component-scoped query observers behind a thin reactive adapter.
- URL-synced filters (`?q=`, `?category=`) + server pagination / `injectInfiniteQuery`.
- HTTP interceptor for error normalisation + retry policy; schema validation at the API boundary.
- Playwright E2E on the three core journeys; `axe-core` a11y checks; GitHub Actions (format → test → build).
- Defensive rendering for malformed API items; locale/currency handling.
