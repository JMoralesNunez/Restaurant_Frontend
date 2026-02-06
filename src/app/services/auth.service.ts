import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:5269/api/Auth';

    register(data: any): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
            tap(response => {
                this.setToken(response.token);
                this.setUser(response.user);
            })
        );
    }

    login(data: any): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
            tap(response => {
                this.setToken(response.token);
                this.setUser(response.user);
            })
        );
    }

    private setToken(token: string): void {
        document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Strict`;
    }

    private setUser(user: User): void {
        localStorage.setItem('user', JSON.stringify(user));
    }

    getUser(): User | null {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    getToken(): string | null {
        const name = 'auth_token=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return null;
    }

    logout(): void {
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict';
        localStorage.removeItem('user');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }
}
