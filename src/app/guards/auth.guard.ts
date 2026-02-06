import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.getUser();

    if (authService.isLoggedIn() && user?.role === 'USER') {
        return true;
    }

    router.navigate(['/login']);
    return false;
};
