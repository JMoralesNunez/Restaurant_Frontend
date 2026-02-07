import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';

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
        if (this.hubConnection) return;

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl('http://localhost:5269/hubs/order', {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .build();

        this.hubConnection.start()
            .then(() => {
                console.log('SignalR connected');

                // Unirse a grupos según el rol
                if (user.role === 'ADMIN') {
                    this.hubConnection?.invoke('JoinAdminGroup');
                }
                this.hubConnection?.invoke('JoinUserGroup', user.id);
            })
            .catch(err => console.error('Error starting SignalR connection:', err));

        this.hubConnection.on('OrderStatusChanged', (data) => {
            this.orderStatusChanged$.next(data);
        });

        this.hubConnection.on('NewOrderReceived', (data) => {
            this.newOrderReceived$.next(data);
        });

        this.hubConnection.on('DashboardUpdated', () => {
            this.dashboardUpdated$.next();
        });
    }

    private stopConnection() {
        if (this.hubConnection) {
            this.hubConnection.stop();
            this.hubConnection = undefined;
        }
    }
}
