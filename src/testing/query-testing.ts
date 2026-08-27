import { ComponentFixture } from '@angular/core/testing';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideQueryClient, QueryClient } from '@ngneat/query';

/**
 * Providers for testing code that uses `@ngneat/query` + `HttpClient`.
 * Retries and caching are disabled so assertions are deterministic.
 */
export function provideQueryTesting(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(),
    provideHttpClientTesting(),
    provideQueryClient(
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0, staleTime: 0 },
          mutations: { retry: false },
        },
      }),
    ),
  ];
}

/** Resolves after pending microtasks and one macrotask (TanStack batches via setTimeout). */
export function tick(ms = 1): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Advances async query/mutation state and flushes it into the view. Runs a few
 * cycles so chained work (fetch -> computed -> render) settles.
 */
export async function settle(fixture: ComponentFixture<unknown>, cycles = 3): Promise<void> {
  for (let i = 0; i < cycles; i++) {
    await tick();
    await fixture.whenStable();
    fixture.detectChanges();
  }
}
