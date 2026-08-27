import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="not-found">
      <h1>Page not found</h1>
      <p>The page you were looking for doesn't exist or was moved.</p>
      <a routerLink="/products" class="btn btn--primary">Go to the catalog</a>
    </div>
  `,
  styles: `
    .not-found {
      text-align: center;
      padding: var(--space-8) var(--space-4);
    }
  `,
})
export class NotFound {}
