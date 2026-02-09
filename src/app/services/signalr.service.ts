import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SignalrService {
    private authService = inject(AuthService);
    private hubConnection?: signalR.HubConnection;

    // Eventos a los que suscribirse
    public orderStatusChanged$ = new Subject<{ orderId: number, status: string }>();
    public newOrderReceived$ = new Subject<{ orderId: number }>();
    public dashboardUpdated$ = new Subject<void>();

    constructor() {
        this.init();
    }

    private init() {
        toObservable(this.authService.currentUser).subscribe(user => {
            if (user) {
                this.startConnection(user);
            } else {
                this.stopConnection();
            }
        });
    }

    private startConnection(user: any) {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) return;

        console.log('Starting SignalR connection...');
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(environment.hubUrl, {
                accessTokenFactory: () => this.authService.getToken() || '',
                // Permitir negociación automática para mejor compatibilidad
                // skipNegotiation: true, 
                // transport: signalR.HttpTransportType.WebSockets 
            })
            .withAutomaticReconnect()
            .build();

        // Registrar manejadores ANTES de iniciar la conexión
        this.hubConnection.on('OrderStatusChanged', (data) => {
            console.log('OrderStatusChanged received:', data);
            this.orderStatusChanged$.next(data);
        });

        this.hubConnection.on('NewOrderReceived', (data) => {
            console.log('NewOrderReceived received:', data);
            this.newOrderReceived$.next(data);
        });

        this.hubConnection.on('DashboardUpdated', () => {
            console.log('DashboardUpdated received');
            this.dashboardUpdated$.next();
        });

        this.hubConnection.start()
            .then(() => {
                console.log('SignalR connected successfully');

                // Unirse a grupos según el rol
                if (user.role === 'ADMIN') {
                    this.hubConnection?.invoke('JoinAdminGroup')
                        .catch(err => console.error('Error joining admin group:', err));
                }
                this.hubConnection?.invoke('JoinUserGroup', user.id)
                    .catch(err => console.error('Error joining user group:', err));
            })
            .catch(err => console.error('Error starting SignalR connection:', err));
    }

    private stopConnection() {
        if (this.hubConnection) {
            this.hubConnection.stop();
            this.hubConnection = undefined;
        }
    }
}
