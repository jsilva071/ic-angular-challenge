import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Renders a consistent loading / error surface around asynchronous content.
 * Projected content is shown only once loading is done and there is no error.
 *
 * <app-async-state [loading]="q.isPending()" [error]="q.error()" (retry)="q.refetch()">
 *   ...success markup...
 * </app-async-state>
 */
@Component({
  selector: 'app-async-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="async-state" role="status" aria-live="polite">
        <span class="async-state__spinner" aria-hidden="true"></span>
        <span>{{ loadingLabel() }}</span>
      </div>
    } @else if (error()) {
      <div class="async-state async-state--error" role="alert">
        <p class="async-state__title">{{ errorLabel() }}</p>
        <p class="async-state__detail">{{ errorDetail() }}</p>
        <button type="button" class="btn btn--ghost" (click)="retry.emit()">Try again</button>
      </div>
    } @else {
      <ng-content />
    }
  `,
  styleUrl: './async-state.scss',
})
export class AsyncState {
  readonly loading = input(false);
  readonly error = input<unknown>(null);
  readonly loadingLabel = input('Loading…');
  readonly errorLabel = input('Something went wrong');

  readonly retry = output<void>();

  protected errorDetail(): string {
    const err = this.error();
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return 'Please check your connection and try again.';
  }
}
