import { Component, inject, signal } from '@angular/core';
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
    isMenuOpen = signal<boolean>(false);

    toggleMenu() {
        this.isMenuOpen.update(v => !v);
    }

    closeMenu() {
        this.isMenuOpen.set(false);
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
