# Restaurant Frontend - Documentación Técnica

Este documento describe la arquitectura, tecnologías y funcionamiento del frontend de la aplicación de Restaurante.

## 🚀 Tecnologías Principales

- **Framework**: Angular (Standalone Components)
- **Estilos**: Tailwind CSS v4 (Agnóstico y flexible)
- **Comunicación en Tiempo Real**: SignalR (@microsoft/signalr)
- **Gestión de Estado**: Signals (Angular Core) + RxJS
- **Notificaciones**: SweetAlert2
- **Cliente HTTP**: Angular HttpClient

## 📂 Estructura del Proyecto

El proyecto sigue una arquitectura modular basada en **Standalone Components**, eliminando la necesidad de `AppModule`.

```
src/app/
├── components/          # Componentes de UI divididos por dominio
│   ├── admin/           # Vistas y componentes para el panel de administración
│   ├── user/            # Vistas para el cliente final (menú, órdenes)
│   └── ...
├── services/            # Lógica de negocio y comunicación con API
│   ├── auth.service.ts  # Autenticación, gestión de tokens y usuarios
│   ├── order.service.ts # CRUD de órdenes
│   └── signalr.service.ts # Gestión de conexión WebSocket
├── guards/              # Protección de rutas (AuthGuard, AdminGuard)
├── interceptors/        # Interceptores HTTP (TokenInterceptor)
├── app.config.ts        # Configuración global de la aplicación (Proveedores)
└── app.routes.ts        # Definición de rutas y lazy loading
```

## 🔌 Comunicación Backend & Configuración

La aplicación está configurada para conectarse al backend a través de variables de entorno, lo que facilita el despliegue en diferentes entornos (local, red local, producción).

- **Archivos de Configuración**: `src/environments/`
  - `environment.ts`: Configuración para producción.
  - `environment.development.ts`: Configuración para desarrollo local.

**Variables Clave:**
- `apiUrl`: URL base de la API REST.
- `hubUrl`: URL del Hub de SignalR para eventos en tiempo real.

> **Nota**: Para pruebas en red local, estas variables apuntan a la IP de la máquina servidor (ej. `10.0.120.28`), permitiendo acceso desde dispositivos externos.

## 📡 SignalR - Actualizaciones en Tiempo Real

El servicio `SignalrService` gestiona la conexión bidireccional con el servidor.

### Funcionamiento:
1. **Inicialización**: Se conecta automáticamente cuando un usuario autenticado inicia sesión.
2. **Autenticación**: Utiliza un `accessTokenFactory` para enviar el JWT token en cada conexión WebSocket, permitiendo al backend identificar al usuario.
3. **Reconexión Automática**: Configurado con `.withAutomaticReconnect()` para tolerar fallos de red.
4. **Eventos**:
   - `OrderStatusChanged`: Notifica cambios de estado en las órdenes.
   - `NewOrderReceived`: Notifica a los administradores de nuevas órdenes.
   - `DashboardUpdated`: Actualiza métricas en tiempo real.

**Flujo de Datos en Componentes:**
Los componentes se suscriben a los `Subject` del servicio (`orderStatusChanged$`) para reaccionar a eventos sin necesidad de recargar la página.

Ejemplo en `OrdersComponent`:
```typescript
this.signalrService.orderStatusChanged$.subscribe((data) => {
    // Actualiza la lista de órdenes localmente para feedback instantáneo
    this.orders.update(current => 
        current.map(order => order.id === data.orderId ? { ...order, status: data.status } : order)
    );
});
```

## 🔐 Autenticación y Seguridad

- **JWT**: El token se almacena en `Cookies` y se recupera mediante `AuthService`.
- **Intercesores**: Un interceptor HTTP adjunta el token Bearer a todas las peticiones salientes hacia la API.
- **Guards**: Protegen las rutas `/admin` y `/user` verificando el rol del usuario en el token decodificado.

## 🛠 Comandos Útiles

- **Iniciar Servidor Local**: `ng serve`
- **Iniciar accesible en Red**: `ng serve --host 0.0.0.0`
- **Build de Producción**: `ng build`

---
*Documentación generada automáticamente para referencia del equipo de desarrollo.*
