import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.currentUser();
    const expectedRole = route.data['role'];

    if (authService.isLoggedIn() && user) {
        if (!expectedRole || user.role === expectedRole) {
            return true;
        }

        if (user.role === 'ADMIN' && expectedRole === 'USER') {
            router.navigate(['/admin']);
            return false;
        }

        if (user.role === 'USER' && expectedRole === 'ADMIN') {
            router.navigate(['/']);
            return false;
        }
    }

    router.navigate(['/login']);
    return false;
};
