import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideQueryClient, QueryClient } from '@ngneat/query';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(), provideQueryClient(() => new QueryClient())],
};
