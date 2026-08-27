import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Read-only star rating. Renders 5 stars filled to the nearest half and exposes
 * the precise value to assistive tech via an aria-label on a group role.
 */
@Component({
  selector: 'app-star-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="star-rating" role="img" [attr.aria-label]="label()">
      @for (star of stars(); track $index) {
        <span class="star-rating__star" [class]="'star-rating__star--' + star" aria-hidden="true"
          >★</span
        >
      }
    </span>
  `,
  styleUrl: './star-rating.scss',
})
export class StarRating {
  /** Average score, expected 0–5. Values outside the range are clamped. */
  readonly rate = input.required<number>();
  /** Optional number of ratings, appended to the accessible label. */
  readonly count = input<number | null>(null);

  private readonly clamped = computed(() => Math.min(5, Math.max(0, this.rate())));

  protected readonly stars = computed<Array<'full' | 'half' | 'empty'>>(() => {
    const rounded = Math.round(this.clamped() * 2) / 2;
    return Array.from({ length: 5 }, (_, i) => {
      if (rounded >= i + 1) return 'full';
      if (rounded >= i + 0.5) return 'half';
      return 'empty';
    });
  });

  protected readonly label = computed(() => {
    const base = `Rated ${this.clamped().toFixed(1)} out of 5`;
    const count = this.count();
    return count == null ? base : `${base}, based on ${count} ratings`;
  });
}
