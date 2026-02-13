import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ProductService, Product, ProductCategory } from '../../../services/product.service';
import { OrderService, OrderItem } from '../../../services/order.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, DecimalPipe, FormsModule],
    templateUrl: './menu.component.html'
})
export class MenuComponent implements OnInit {
    private productService = inject(ProductService);
    private orderService = inject(OrderService);
    private router = inject(Router);

    products = signal<Product[]>([]);
    cart = signal<OrderItem[]>([]);
    isLoading = signal<boolean>(true);
    isSubmitting = signal<boolean>(false);

    cartTotal = computed(() => {
        return this.cart().reduce((total, item) => total + (item.subtotal || 0), 0);
    });

    selectedCategory = signal<ProductCategory>(ProductCategory.Food);
    ProductCategory = ProductCategory; // For template access

    categories = [
        {
            id: ProductCategory.Food,
            name: 'Platos',
            iconPath: 'M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9zm0-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3H3V6zm3 8h12v2H6v-2z'
        },
        {
            id: ProductCategory.Drink,
            name: 'Bebidas',
            iconPath: 'M7 2h10l2 10H5L7 2zm0 13h10v5a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-5zm2-10h6V3H9v2z'
        },
        {
            id: ProductCategory.Dessert,
            name: 'Postres',
            iconPath: 'M12 2l3 5h6v3l-3 5v7H6v-7l-3-5V7h6l3-5zm0 3.5L10.3 7h3.4L12 5.5zM5 9v1l2 3h10l2-3V9H5zm1 6v5h12v-5H6z'
        }
    ];

    getCategoryLabel(id: ProductCategory): string {
        return this.categories.find(c => c.id === id)?.name || 'Productos';
    }

    filteredProducts = computed(() => {
        return this.products().filter(p => p.category === this.selectedCategory());
    });

    setCategory(category: ProductCategory) {
        this.selectedCategory.set(category);
    }

    scrollToCart() {
        const element = document.getElementById('cart-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    ngOnInit() {
        this.productService.getProducts().subscribe({
            next: (data) => {
                this.products.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar productos:', err);
                this.isLoading.set(false);
            }
        });
    }

    addToCart(product: Product) {
        const currentCart = this.cart();
        const existingIndex = currentCart.findIndex(item => item.productId === product.id);

        if (existingIndex > -1) {
            const updatedCart = [...currentCart];
            updatedCart[existingIndex] = {
                ...updatedCart[existingIndex],
                quantity: updatedCart[existingIndex].quantity + 1,
                subtotal: (updatedCart[existingIndex].quantity + 1) * (updatedCart[existingIndex].price || 0)
            };
            this.cart.set(updatedCart);
        } else {
            this.cart.set([...currentCart, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                price: product.price,
                subtotal: product.price
            }]);
        }
    }

    updateQuantity(index: number, change: number) {
        const currentCart = [...this.cart()];
        const item = currentCart[index];
        item.quantity += change;

        if (item.quantity <= 0) {
            this.removeFromCart(index);
        } else {
            item.subtotal = item.quantity * (item.price || 0);
            this.cart.set(currentCart);
        }
    }

    removeFromCart(index: number) {
        const currentCart = this.cart();
        this.cart.set(currentCart.filter((_, i) => i !== index));
    }

    updateComment(index: number, comment: string) {
        const currentCart = [...this.cart()];
        currentCart[index] = { ...currentCart[index], comment };
        this.cart.set(currentCart);
    }

    async confirmOrder() {
        if (this.cart().length === 0) return;

        const result = await Swal.fire({
            title: '¿Confirmar pedido?',
            text: `Estás a punto de pedir ${this.cart().length} productos por un total de $${this.cartTotal().toFixed(2)}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'Cancelar',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-xl border border-gray-100',
                title: 'text-xl font-bold text-gray-800',
                htmlContainer: 'text-gray-600',
                confirmButton: 'px-6 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105',
                cancelButton: 'px-6 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105'
            }
        });

        if (!result.isConfirmed) return;

        this.isSubmitting.set(true);
        const orderData = {
            items: this.cart().map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                comment: item.comment
            }))
        };

        this.orderService.createOrder(orderData).subscribe({
            next: (response) => {
                this.cart.set([]);
                Swal.fire({
                    title: '¡Pedido realizado!',
                    text: 'Tu orden ha sido enviada a la cocina.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-2xl shadow-xl'
                    }
                }).then(() => {
                    this.router.navigate(['/orders']);
                });
            },
            error: (err) => {
                console.error('Error al confirmar orden', err);
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo procesar tu pedido. Por favor intenta de nuevo.',
                    icon: 'error',
                    confirmButtonColor: '#3085d6'
                });
                this.isSubmitting.set(false);
            },
            complete: () => {
                this.isSubmitting.set(false);
            }
        });
    }
}
