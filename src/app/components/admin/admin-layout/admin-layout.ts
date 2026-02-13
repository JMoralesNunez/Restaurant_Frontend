import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { NgxThemeToggleComponent, OmDarkIcon, OmLightIcon, OmLabel } from '@omnedia/ngx-theme-toggle';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NgxThemeToggleComponent, OmDarkIcon, OmLightIcon, OmLabel],
  templateUrl: './admin-layout.html',
  styles: ``
})
export class AdminLayoutComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  isSidebarOpen = signal<boolean>(window.innerWidth > 1024);

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeOnMobile() {
    if (window.innerWidth < 1024) {
      this.isSidebarOpen.set(false);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
