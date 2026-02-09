import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { NgxThemeToggleComponent, OmDarkIcon, OmLightIcon, OmLabel } from '@omnedia/ngx-theme-toggle';

@Component({
    selector: 'app-user-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NgxThemeToggleComponent, OmDarkIcon, OmLightIcon, OmLabel],
    templateUrl: './user-layout.component.html'
})
export class UserLayoutComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    user = this.authService.currentUser;

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
