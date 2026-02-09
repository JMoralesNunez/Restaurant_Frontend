import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

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
        role: user.role
      });
    } else {
      this.isEditMode.set(false);
      this.editingUserId.set(null);
      this.form.reset({
        name: '',
        email: '',
        role: 'USER',
        password: ''
      });
      // Add required validator for password in create mode
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  closeModal() {
    this.showModal.set(false);
    this.isSubmitting.set(false);
    this.form.reset();
    // Reset password validators to initial state (minLength only) after closing
    this.form.get('password')?.setValidators([Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    const formData = this.form.value;

    if (this.isEditMode() && this.editingUserId()) {
      // Update logic: only name, email, and role (mapped to integer)
      const rawValue = this.form.value;
      const updateData = {
        name: rawValue.name,
        email: rawValue.email,
        role: rawValue.role === 'ADMIN' ? 1 : 0
      };

      this.authService.updateUser(this.editingUserId()!, updateData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Usuario actualizado',
            text: 'Los datos del usuario han sido actualizados correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error updating user', err);
          this.isSubmitting.set(false);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar el usuario'
          });
        }
      });
    } else {
      // Create logic
      this.authService.createUser(formData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Usuario creado',
            text: 'El usuario ha sido creado correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error creating user', err);
          this.isSubmitting.set(false);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear el usuario'
          });
        }
      });
    }
  }

  editUser(user: User) {
    this.openModal(user);
  }

  async deleteUser(id: number) {
    if (id === this.currentUser()?.id) {
      Swal.fire({
        icon: 'error',
        title: 'Acción no permitida',
        text: 'No puedes eliminar tu propia cuenta'
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.authService.deleteUser(id).subscribe({
        next: () => {
          this.users.update(users => users.filter(u => u.id !== id));
          Swal.fire(
            'Eliminado',
            'el usuario ha sido eliminado.',
            'success'
          );
        },
        error: (err) => {
          console.error('Error deleting user', err);
          Swal.fire(
            'Error',
            'No se pudo eliminar el usuario.',
            'error'
          );
        }
      });
    }
  }
}
