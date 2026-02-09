import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { ProductService, Product, ProductCategory } from '../../../../services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-list.html',
  styles: ``
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);
  public router = inject(Router);

  products = signal<Product[]>([]);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  ProductCategory = ProductCategory;

  // Modal state
  showModal = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  editingProductId = signal<number | null>(null);
  selectedFile: File | null = null;
  imagePreview = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    category: [ProductCategory.Food, [Validators.required]],
    isActive: [true]
  });

  selectedCategory = signal<ProductCategory | 'all'>('all');

  filteredProducts = computed(() => {
    const category = this.selectedCategory();
    if (category === 'all') return this.products();
    return this.products().filter(p => p.category === category);
  });

  categories: { id: ProductCategory | 'all', name: string }[] = [
    { id: 'all', name: 'Todos' },
    { id: ProductCategory.Food, name: 'Platos' },
    { id: ProductCategory.Drink, name: 'Bebidas' },
    { id: ProductCategory.Dessert, name: 'Postres' }
  ];

  ngOnInit() {
    this.loadProducts();
  }

  setCategory(category: ProductCategory | 'all') {
    this.selectedCategory.set(category);
  }

  loadProducts() {
    this.isLoading.set(true);
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

  openModal(product?: Product) {
    this.showModal.set(true);
    if (product) {
      this.isEditMode.set(true);
      this.editingProductId.set(product.id);
      this.form.patchValue({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        isActive: product.isActive
      });
      this.imagePreview.set(product.imageUrl || null);
    } else {
      this.isEditMode.set(false);
      this.editingProductId.set(null);
      this.form.reset({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category: ProductCategory.Food,
        isActive: true
      });
      this.imagePreview.set(null);
      this.selectedFile = null;
    }
  }

  closeModal() {
    this.showModal.set(false);
    this.isSubmitting.set(false);
    this.form.reset();
    this.imagePreview.set(null);
    this.selectedFile = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  triggerImageUpload() {
    const fileInput = document.getElementById('productImage') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    const formData = new FormData();

    // Iterate through form controls and append to FormData
    const formValue = this.form.value;
    Object.keys(formValue).forEach(key => {
      const value = formValue[key as keyof typeof formValue];
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const request = this.isEditMode() && this.editingProductId()
      ? this.productService.updateProduct(this.editingProductId()!, formData)
      : this.productService.createProduct(formData);

    request.subscribe({
      next: () => {
        this.loadProducts();
        this.closeModal();
        Swal.fire({
          icon: 'success',
          title: this.isEditMode() ? 'Producto actualizado' : 'Producto creado',
          text: `El producto ha sido ${this.isEditMode() ? 'actualizado' : 'creado'} correctamente`,
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Error saving product', err);
        this.isSubmitting.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el producto'
        });
      }
    });
  }

  editProduct(product: Product) {
    this.openModal(product);
  }

  async deleteProduct(id: number) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.products.update(products => products.filter(p => p.id !== id));
          Swal.fire(
            'Eliminado',
            'El producto ha sido eliminado.',
            'success'
          );
        },
        error: (err) => {
          console.error('Error deleting product', err);
          Swal.fire(
            'Error',
            'No se pudo eliminar el producto.',
            'error'
          );
        }
      });
    }
  }

  getCategoryName(value: number): string {
    return ProductCategory[value];
  }
}
