import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { UserLayoutComponent } from './components/user/user-layout/user-layout.component';
import { authGuard } from './guards/auth.guard';
import { MenuComponent } from './components/user/menu/menu.component';
import { OrdersComponent } from './components/user/orders/orders.component';
import { AdminLayoutComponent } from './components/admin/admin-layout/admin-layout';
import { DashboardComponent } from './components/admin/dashboard/dashboard';
import { ProductListComponent } from './components/admin/products/product-list/product-list';
import { ProductFormComponent } from './components/admin/products/product-form/product-form';
import { UserListComponent } from './components/admin/users/user-list/user-list';
import { UserFormComponent } from './components/admin/users/user-form/user-form';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: '',
        component: UserLayoutComponent,
        canActivate: [authGuard],
        data: { role: 'USER' },
        children: [
            { path: 'menu', component: MenuComponent },
            { path: 'orders', component: OrdersComponent },
            { path: '', redirectTo: 'menu', pathMatch: 'full' }
        ]
    },
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [authGuard],
        data: { role: 'ADMIN' },
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'products', component: ProductListComponent },
            { path: 'products/new', component: ProductFormComponent },
            { path: 'products/edit/:id', component: ProductFormComponent },
            { path: 'users', component: UserListComponent },
            { path: 'users/new', component: UserFormComponent },
            { path: 'users/edit/:id', component: UserFormComponent },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    }
];
