import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductsService } from '../../../core/api/products.service';
import { NewProduct } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly products = inject(ProductsService);
  private readonly router = inject(Router);

  private readonly categoriesQuery = this.products.getCategories();
  protected readonly categories = this.categoriesQuery.result;

  private readonly createMutation = this.products.createProduct();
  protected readonly mutation = this.createMutation.result;

  protected readonly submitted = signal(false);
  protected readonly createdId = signal<number | null>(null);

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    price: [null as number | null, [Validators.required, Validators.min(0.01)]],
    category: ['', [Validators.required]],
    image: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/i)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  });

  protected controlInvalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  protected onSubmit(): void {
    this.submitted.set(true);
    this.createdId.set(null);

    if (this.form.invalid) {
      this.focusFirstError();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: NewProduct = {
      title: raw.title.trim(),
      price: Number(raw.price),
      category: raw.category,
      image: raw.image.trim(),
      description: raw.description.trim(),
    };

    this.createMutation.mutate(payload, {
      onSuccess: (created) => {
        this.createdId.set(created.id ?? null);
        this.form.reset();
        this.submitted.set(false);
      },
    });
  }

  protected viewCreated(): void {
    const id = this.createdId();
    if (id != null) {
      this.router.navigate(['/products', id]);
    }
  }

  private focusFirstError(): void {
    queueMicrotask(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      el?.focus();
    });
  }
}
