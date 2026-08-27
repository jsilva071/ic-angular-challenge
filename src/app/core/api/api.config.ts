import { InjectionToken } from '@angular/core';

/**
 * Base URL for the Fake Store API. Exposed as a token so it can be swapped
 * per environment and overridden in tests without touching service code.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'https://fakestoreapi.com',
});
