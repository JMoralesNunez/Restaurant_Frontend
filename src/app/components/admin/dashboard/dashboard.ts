import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { OrderService, Order } from '../../../services/order.service';
import { SignalrService } from '../../../services/signalr.service';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe],
  templateUrl: './dashboard.html',
  styles: ``
})
export class DashboardComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private signalrService = inject(SignalrService);
  private destroy$ = new Subject<void>();

  stats = signal([
    { title: 'Pedidos Totales', value: '0', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Pedidos Pendientes', value: '0', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-amber-500', bg: 'bg-amber-100' },
    { title: 'Ventas de Hoy', value: '$0', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-600', bg: 'bg-blue-100' }
  ]);

  recentOrders = signal<any[]>([]);
  selectedOrder = signal<any>(null);
  isLoading = signal<boolean>(true);
  updatingStatus = signal<boolean>(false);
  revenueFilter = signal<'day' | 'week' | 'month'>('day');

  ngOnInit() {
    this.loadDashboardData();

    // Escuchar alertas de tiempo real
    this.signalrService.newOrderReceived$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadDashboardData(false));

    this.signalrService.dashboardUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadDashboardData(false));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setRevenueFilter(filter: 'day' | 'week' | 'month') {
    this.revenueFilter.set(filter);
    // Recalculate stats with the new filter
    this.orderService.getOrders().subscribe(orders => this.calculateStats(orders));
  }

  loadDashboardData(showSpinner: boolean = true) {
    if (showSpinner) this.isLoading.set(true);
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.calculateStats(orders);
        this.processRecentOrders(orders);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
        this.isLoading.set(false);
      }
    });
  }

  calculateStats(orders: Order[]) {
    // Total Orders
    const totalOrders = orders.length;

    // Pending Orders (Status 0 = PENDING)
    const pendingOrders = orders.filter(o => o.status === 0 || o.status === 'PENDING').length;

    // Revenue calculation based on filter
    const now = new Date();
    const filter = this.revenueFilter();
    let filterTitle = "Ventas de Hoy";

    const filteredRevenue = orders
      .filter(o => {
        const orderDate = new Date(o.createdAt || '');
        const isDelivered = o.status === 2 || o.status === 'DELIVERED';

        if (!isDelivered) return false;

        if (filter === 'day') {
          return orderDate.toDateString() === now.toDateString();
        } else if (filter === 'week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return orderDate >= startOfWeek;
        } else if (filter === 'month') {
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        }
        return false;
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);

    if (filter === 'week') filterTitle = "Ventas de la Semana";
    if (filter === 'month') filterTitle = "Ventas del Mes";

    this.stats.set([
      { title: 'Pedidos Totales', value: totalOrders.toString(), icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', color: 'text-green-600', bg: 'bg-green-100' },
      { title: 'Pedidos Pendientes', value: pendingOrders.toString(), icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-amber-500', bg: 'bg-amber-100' },
      { title: filterTitle, value: `$${filteredRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-600', bg: 'bg-blue-100' }
    ]);
  }

  processRecentOrders(orders: Order[]) {
    // Sort by date descending and take top 5
    const sortedOrders = [...orders].sort((a, b) => {
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    }).slice(0, 5);

    const formattedOrders = sortedOrders.map(o => ({
      id: `#${o.id}`,
      user: o.userName || 'Usuario Desconocido',
      date: o.createdAt,
      status: this.getStatusLabel(o.status),
      originalStatus: o.status,
      total: o.total,
      statusColor: this.getStatusColor(o.status),
      items: o.items
    }));

    this.recentOrders.set(formattedOrders);

    // Update selected order if it exists
    const currentSelected = this.selectedOrder();
    if (currentSelected) {
      const updatedSelected = formattedOrders.find(o => o.id === currentSelected.id);
      if (updatedSelected) {
        this.selectedOrder.set(updatedSelected);
      }
    } else if (formattedOrders.length > 0) {
      this.selectedOrder.set(formattedOrders[0]);
    }
  }

  getStatusLabel(status: any): string {
    const statusMap: { [key: string]: string } = {
      0: 'Pendiente', 'PENDING': 'Pendiente',
      1: 'Preparando', 'PREPARING': 'Preparando',
      2: 'Entregado', 'DELIVERED': 'Entregado',
      3: 'Cancelado', 'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || 'Desconocido';
  }

  getStatusColor(status: any): string {
    const colorMap: { [key: string]: string } = {
      0: 'bg-amber-100 text-amber-700', 'PENDING': 'bg-amber-100 text-amber-700',
      1: 'bg-blue-100 text-blue-700', 'PREPARING': 'bg-blue-100 text-blue-700',
      2: 'bg-green-100 text-green-700', 'DELIVERED': 'bg-green-100 text-green-700',
      3: 'bg-red-100 text-red-700', 'CANCELLED': 'bg-red-100 text-red-700'
    };
    return colorMap[status] || 'bg-slate-100 text-slate-700';
  }

  updateOrderStatus(orderId: string, statusValue: string) {
    const id = parseInt(orderId.replace('#', ''));
    const status = parseInt(statusValue);

    this.updatingStatus.set(true);
    this.orderService.updateOrderStatus(id, status).subscribe({
      next: (updatedOrder) => {
        this.loadDashboardData();
        this.updatingStatus.set(false);

        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
          }
        });
        Toast.fire({
          icon: 'success',
          title: 'Estado actualizado correctamente'
        });
      },
      error: (err) => {
        console.error('Error updating order status', err);
        this.updatingStatus.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el estado del pedido'
        });
      }
    });
  }

  selectOrder(order: any) {
    this.selectedOrder.set(order);
  }
}
