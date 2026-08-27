import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { StarRating } from './star-rating';

@Component({
  imports: [StarRating],
  template: `<app-star-rating [rate]="rate" [count]="count" />`,
})
class Host {
  rate = 0;
  count: number | null = null;
}

function render(rate: number, count: number | null = null) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.rate = rate;
  fixture.componentInstance.count = count;
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('StarRating', () => {
  it('rounds to the nearest half star', () => {
    const el = render(3.9);
    const stars = el.querySelectorAll('.star-rating__star');
    const classes = Array.from(stars).map((s) => s.className);
    expect(classes.filter((c) => c.includes('--full'))).toHaveLength(4);
    expect(classes.filter((c) => c.includes('--empty'))).toHaveLength(1);
  });

  it('renders a half star for x.25–x.74', () => {
    const el = render(3.5);
    expect(el.querySelectorAll('.star-rating__star--half')).toHaveLength(1);
    expect(el.querySelectorAll('.star-rating__star--full')).toHaveLength(3);
  });

  it('clamps out-of-range values', () => {
    const el = render(7);
    expect(el.querySelectorAll('.star-rating__star--full')).toHaveLength(5);
  });

  it('exposes a precise accessible label including the count', () => {
    const el = render(3.9, 120);
    expect(el.querySelector('.star-rating')?.getAttribute('aria-label')).toBe(
      'Rated 3.9 out of 5, based on 120 ratings',
    );
  });

  it('omits the count from the label when not provided', () => {
    const el = render(2);
    expect(el.querySelector('.star-rating')?.getAttribute('aria-label')).toBe('Rated 2.0 out of 5');
  });
});
