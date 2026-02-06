import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { UserLayoutComponent } from './components/user/user-layout/user-layout.component';
import { authGuard } from './guards/auth.guard';
import { MenuComponent } from './components/user/menu/menu.component';
import { OrdersComponent } from './components/user/orders/orders.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: '',
        component: UserLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: 'menu', component: MenuComponent },
            { path: 'orders', component: OrdersComponent },
            { path: '', redirectTo: 'menu', pathMatch: 'full' }
        ]
    }
];
