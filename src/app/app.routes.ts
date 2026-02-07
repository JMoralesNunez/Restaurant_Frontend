import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: '',
        loadComponent: () => import('./components/user/user-layout/user-layout.component').then(m => m.UserLayoutComponent),
        canActivate: [authGuard],
        data: { role: 'USER' },
        children: [
            {
                path: 'menu',
                loadComponent: () => import('./components/user/menu/menu.component').then(m => m.MenuComponent)
            },
            {
                path: 'orders',
                loadComponent: () => import('./components/user/orders/orders.component').then(m => m.OrdersComponent)
            },
            { path: '', redirectTo: 'menu', pathMatch: 'full' }
        ]
    },
    {
        path: 'admin',
        loadComponent: () => import('./components/admin/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
        canActivate: [authGuard],
        data: { role: 'ADMIN' },
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./components/admin/dashboard/dashboard').then(m => m.DashboardComponent)
            },
            {
                path: 'products',
                loadComponent: () => import('./components/admin/products/product-list/product-list').then(m => m.ProductListComponent)
            },
            {
                path: 'users',
                loadComponent: () => import('./components/admin/users/user-list/user-list').then(m => m.UserListComponent)
            },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    }
];
