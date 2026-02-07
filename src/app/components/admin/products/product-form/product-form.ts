import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService, Product, ProductCategory } from '../../../../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.html',
  styles: ``
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    category: [0, [Validators.required]],
    isActive: [true]
  });

  isEditMode = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  productId: number | null = null;
  selectedFile: File | null = null;
  imagePreview = signal<string | null>(null);

  categories = [
    { value: ProductCategory.Food, label: 'Comida' },
    { value: ProductCategory.Drink, label: 'Bebida' },
    { value: ProductCategory.Dessert, label: 'Postre' }
  ];

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.productId = +params['id'];
        this.loadProduct(this.productId);
      }
    });
  }

  loadProduct(id: number) {
    this.isLoading.set(true);
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.form.patchValue({
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.category,
          isActive: product.isActive
        });
        if (product.imageUrl) {
          this.imagePreview.set(product.imageUrl);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading product', err);
        this.isLoading.set(false);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    const formData = new FormData();

    Object.keys(this.form.controls).forEach(key => {
      const value = this.form.get(key)?.value;
      formData.append(key, value);
    });

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    if (this.isEditMode() && this.productId) {
      this.productService.updateProduct(this.productId, formData).subscribe({
        next: () => {
          this.router.navigate(['/admin/products']);
        },
        error: (err) => {
          console.error('Error updating product', err);
          this.isLoading.set(false);
        }
      });
    } else {
      this.productService.createProduct(formData).subscribe({
        next: () => {
          this.router.navigate(['/admin/products']);
        },
        error: (err) => {
          console.error('Error creating product', err);
          this.isLoading.set(false);
        }
      });
    }
  }
}
