import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    isActive: boolean;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:5269/api/Products';

    getProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(this.apiUrl);
    }
}
