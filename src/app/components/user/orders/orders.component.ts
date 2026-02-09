import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { OrderService, Order } from '../../../services/order.service';
import { RouterLink } from '@angular/router';
import { SignalrService } from '../../../services/signalr.service';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-orders',
    standalone: true,
    imports: [CommonModule, RouterLink, DatePipe, DecimalPipe],
    templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit, OnDestroy {
    private orderService = inject(OrderService);
    private signalrService = inject(SignalrService);
    private destroy$ = new Subject<void>();

    orders = signal<Order[]>([]);
    isLoading = signal<boolean>(true);

    ngOnInit() {
        this.loadOrders();

        // Escuchar cambios de estado en tiempo real vía SignalR
        this.signalrService.orderStatusChanged$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.loadOrders(false);
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadOrders(showSpinner: boolean = true) {
        if (showSpinner) this.isLoading.set(true);

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

    async cancelOrder(id: number | undefined) {
        if (!id) return;

        const result = await Swal.fire({
            title: '¿Cancelar orden?',
            text: '¿Estás seguro de que deseas cancelar esta orden? Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cancelar orden',
            cancelButtonText: 'No, mantener orden',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-xl',
                title: 'text-xl font-bold text-gray-800',
                htmlContainer: 'text-gray-600',
                confirmButton: 'px-6 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105',
                cancelButton: 'px-6 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105'
            }
        });

        if (result.isConfirmed) {
            this.orderService.cancelOrder(id).subscribe({
                next: () => {
                    Swal.fire({
                        title: 'Orden cancelada',
                        text: 'La orden ha sido cancelada exitosamente.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                        background: '#ffffff',
                        customClass: {
                            popup: 'rounded-2xl shadow-xl'
                        }
                    });
                    // Refrescar la lista de órdenes
                    this.loadOrders(false);
                },
                error: (err) => {
                    console.error('Error al cancelar la orden:', err);
                    Swal.fire({
                        title: 'Error',
                        text: 'No se pudo cancelar la orden. Por favor, intenta de nuevo.',
                        icon: 'error',
                        confirmButtonColor: '#3085d6'
                    });
                }
            });
        }
    }
}
