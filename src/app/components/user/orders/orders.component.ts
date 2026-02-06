import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { OrderService, Order } from '../../../services/order.service';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-orders',
    standalone: true,
    imports: [CommonModule, RouterLink, DatePipe, DecimalPipe],
    templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {
    private orderService = inject(OrderService);

    orders = signal<Order[]>([]);
    isLoading = signal<boolean>(true);

    ngOnInit() {
        this.orderService.getOrders().subscribe({
            next: (data) => {
                const sortedOrders = data.sort((a, b) => {
                    return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
                });
                this.orders.set(sortedOrders);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar órdenes:', err);
                this.isLoading.set(false);
            }
        });
    }

    getStatusClass(status: string): string {
        switch (status.toUpperCase()) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700';
            case 'COMPLETED': return 'bg-green-100 text-green-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    }
}
