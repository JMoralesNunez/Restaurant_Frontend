import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService, User } from '../../../../services/auth.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.html',
  styles: ``
})
export class UserListComponent implements OnInit {
  private authService = inject(AuthService);
  public router = inject(Router);

  users = signal<User[]>([]);
  isLoading = signal<boolean>(true);
  currentUser = this.authService.currentUser;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.authService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading users', err);
        this.isLoading.set(false);
      }
    });
  }

  editUser(id: number) {
    this.router.navigate(['/admin/users/edit', id]);
  }

  deleteUser(id: number) {
    if (id === this.currentUser()?.id) {
      alert('Cannot delete your own account');
      return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
      this.authService.deleteUser(id).subscribe({
        next: () => {
          this.users.update(users => users.filter(u => u.id !== id));
        },
        error: (err) => console.error('Error deleting user', err)
      });
    }
  }
}
