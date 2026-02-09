import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface OrderItem {
    id?: number;
    productId: number;
    productName?: string;
    quantity: number;
    price?: number;
    comment?: string;
    subtotal?: number;
}

export interface Order {
    id?: number;
    userId?: number;
    userName?: string;
    status?: string | number;
    total?: number;
    createdAt?: string;
    items: OrderItem[];
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/Orders`;

    getOrders(): Observable<Order[]> {
        return this.http.get<Order[]>(this.apiUrl);
    }

    createOrder(order: { items: { productId: number; quantity: number; comment?: string }[] }): Observable<Order> {
        return this.http.post<Order>(this.apiUrl, order);
    }

    cancelOrder(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    updateOrderStatus(id: number, status: number): Observable<Order> {
        return this.http.patch<Order>(`${this.apiUrl}/${id}/status`, { status });
    }
}
