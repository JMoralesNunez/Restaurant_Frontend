import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ProductService, Product } from '../../../services/product.service';
import { OrderService, OrderItem } from '../../../services/order.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, DecimalPipe],
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

    confirmOrder() {
        if (this.cart().length === 0) return;

        this.isSubmitting.set(true);
        const orderData = {
            items: this.cart().map(item => ({
                productId: item.productId,
                quantity: item.quantity
            }))
        };

        this.orderService.createOrder(orderData).subscribe({
            next: (response) => {
                this.cart.set([]);
                this.router.navigate(['/orders']);
            },
            error: (err) => {
                console.error('Error al confirmar orden', err);
                this.isSubmitting.set(false);
            },
            complete: () => {
                this.isSubmitting.set(false);
            }
        });
    }
}
