import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderItem {
    id?: number;
    productId: number;
    productName?: string;
    quantity: number;
    price?: number;
    subtotal?: number;
}

export interface Order {
    id?: number;
    userId?: number;
    userName?: string;
    status?: string;
    total?: number;
    createdAt?: string;
    items: OrderItem[];
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:5269/api/Orders';

    getOrders(): Observable<Order[]> {
        return this.http.get<Order[]>(this.apiUrl);
    }

    createOrder(order: { items: { productId: number; quantity: number }[] }): Observable<Order> {
        return this.http.post<Order>(this.apiUrl, order);
    }

    cancelOrder(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
