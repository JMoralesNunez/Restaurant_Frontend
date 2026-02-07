import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ProductService, Product, ProductCategory } from '../../../services/product.service';
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

    selectedCategory = signal<ProductCategory>(ProductCategory.Food);
    ProductCategory = ProductCategory; // For template access

    categories = [
        {
            id: ProductCategory.Food,
            name: 'Comida',
            iconPath: 'M21 16H3V14H21V16ZM21 12H3V10H21V12ZM20 20H4C3.45 20 3 19.55 3 19V18H21V19C21 19.55 20.55 20 20 20ZM12 2C15.87 2 19 5.13 19 9H5C5 5.13 8.13 2 12 2Z' // Better Burger
        },
        {
            id: ProductCategory.Drink,
            name: 'Bebidas',
            iconPath: 'M7.5 7L5.5 21H18.5L16.5 7H7.5ZM10.5 2H13.5L14.5 5H9.5L10.5 2Z' // Better Drink/Cup
        },
        {
            id: ProductCategory.Dessert,
            name: 'Postres',
            iconPath: 'M12,2C15.86,2 19,5.13 19,9C19,11.33 17.89,13.4 16.12,14.65C17.07,15.8 17.07,17.46 16.12,18.61C14.93,20.04 12.83,19.86 12,19C11.17,19.86 9.07,20.04 7.88,18.61C6.93,17.46 6.93,15.8 7.88,14.65C6.11,13.4 5,11.33 5,9C5,5.13 8.14,2 12,2M12,5C10.9,5 10,5.9 10,7C10,8.11 10.9,9 12,9C13.11,9 14,8.11 14,7C14,5.9 13.11,5 12,5Z' // Ice Cream/Dessert
        }
    ];

    filteredProducts = computed(() => {
        return this.products().filter(p => p.category === this.selectedCategory());
    });

    setCategory(category: ProductCategory) {
        this.selectedCategory.set(category);
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
