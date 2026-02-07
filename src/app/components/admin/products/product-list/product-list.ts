import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ProductService, Product, ProductCategory } from '../../../../services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.html',
  styles: ``
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  public router = inject(Router);

  products = signal<Product[]>([]);
  isLoading = signal<boolean>(true);
  ProductCategory = ProductCategory;

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading products', err);
        this.isLoading.set(false);
      }
    });
  }

  editProduct(id: number) {
    this.router.navigate(['/admin/products/edit', id]);
  }

  deleteProduct(id: number) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.products.update(products => products.filter(p => p.id !== id));
        },
        error: (err) => console.error('Error deleting product', err)
      });
    }
  }

  getCategoryName(value: number): string {
    return ProductCategory[value];
  }
}
