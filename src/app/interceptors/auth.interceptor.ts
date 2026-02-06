import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    console.log('Interceptando petición:', req.url);

    // Extraer token directamente para evitar circularidad con AuthService
    const name = 'auth_token=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    let token = null;

    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(name) === 0) {
            token = c.substring(name.length, c.length);
            break;
        }
    }

    if (token) {
        console.log('Token encontrado en interceptor, añadiendo');
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(cloned);
    }

    console.log('Token NO encontrado en interceptor');
    return next(req);
};
