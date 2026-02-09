import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response.user.role === 'ADMIN') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (err) => {
          console.error('Error al iniciar sesión', err);
          this.isLoading = false;

          let errorMessage = 'Hubo un problema al iniciar sesión. Por favor, intenta de nuevo.';
          if (err.status === 401) {
            errorMessage = 'Correo o contraseña incorrectos.';
            this.loginForm.reset();
          }

          Swal.fire({
            icon: 'error',
            title: 'Error de autenticación',
            text: errorMessage,
            confirmButtonColor: '#3085d6',
          });
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
}
