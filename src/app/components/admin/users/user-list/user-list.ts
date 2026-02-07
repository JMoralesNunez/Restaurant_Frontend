import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService, User } from '../../../../services/auth.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-list.html',
  styles: ``
})
export class UserListComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  public router = inject(Router);

  users = signal<User[]>([]);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  currentUser = this.authService.currentUser;

  // Modal state
  showModal = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  editingUserId = signal<number | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
    role: ['USER', [Validators.required]]
  });

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
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

  openModal(user?: User) {
    this.showModal.set(true);
    if (user) {
      this.isEditMode.set(true);
      this.editingUserId.set(user.id);
      this.form.patchValue({
        name: user.name,
        email: user.email,
        role: user.role,
        password: ''
      });
      // Password not required for editing
      this.form.get('password')?.removeValidators(Validators.required);
    } else {
      this.isEditMode.set(false);
      this.editingUserId.set(null);
      this.form.reset({
        name: '',
        email: '',
        role: 'USER',
        password: ''
      });
      // Password required for new user
      this.form.get('password')?.addValidators(Validators.required);
    }
    this.form.get('password')?.updateValueAndValidity();
  }

  closeModal() {
    this.showModal.set(false);
    this.isSubmitting.set(false);
    this.form.reset();
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    const formData = this.form.value;

    if (this.isEditMode() && this.editingUserId()) {
      // Update logic
      const updateData: any = { ...formData };
      if (!updateData.password) delete updateData.password;

      this.authService.updateUser(this.editingUserId()!, updateData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error updating user', err);
          this.isSubmitting.set(false);
        }
      });
    } else {
      // Create logic
      this.authService.createUser(formData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error creating user', err);
          this.isSubmitting.set(false);
        }
      });
    }
  }

  editUser(user: User) {
    this.openModal(user);
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
