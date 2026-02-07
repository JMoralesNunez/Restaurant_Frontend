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

    getStatusClass(status: string | number | undefined): string {
        const s = status?.toString().toUpperCase() || '';
        switch (s) {
            case 'PENDING':
            case '0':
                return 'bg-yellow-100 text-yellow-700';
            case 'PREPARING':
            case '1':
                return 'bg-blue-100 text-blue-700';
            case 'DELIVERED':
            case '2':
            case 'COMPLETED':
                return 'bg-green-100 text-green-700';
            case 'CANCELLED':
            case '3':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    }

    getStatusLabel(status: string | number | undefined): string {
        const s = status?.toString().toUpperCase() || '';
        switch (s) {
            case '0':
            case 'PENDING': return 'Pendiente';
            case '1':
            case 'PREPARING': return 'En Preparación';
            case '2':
            case 'DELIVERED':
            case 'COMPLETED': return 'Entregado';
            case '3':
            case 'CANCELLED': return 'Cancelado';
            default: return s || 'Desconocido';
        }
    }

    isPending(status: string | number | undefined): boolean {
        const s = status?.toString().toUpperCase() || '';
        return s === 'PENDING' || s === '0';
    }

    cancelOrder(id: number | undefined) {
        if (!id) return;

        if (confirm('¿Estás seguro de que deseas cancelar esta orden?')) {
            this.orderService.cancelOrder(id).subscribe({
                next: () => {
                    // Refrescar la lista de órdenes
                    this.ngOnInit();
                },
                error: (err) => {
                    console.error('Error al cancelar la orden:', err);
                    alert('No se pudo cancelar la orden. Por favor, intenta de nuevo.');
                }
            });
        }
    }
}
