import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.html',
  styles: ``
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]], // Required only for new users
    role: ['USER', [Validators.required]]
  });

  isEditMode = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  userId: number | null = null;
  users: any[] = []; // To find user for edit since API doesn't support get single user yet

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.userId = +params['id'];
        // Remove password validator for edit mode
        this.form.get('password')?.removeValidators(Validators.required);
        this.form.get('password')?.updateValueAndValidity();
        this.loadUser(this.userId);
      } else {
        // Add password validator for create mode
        this.form.get('password')?.addValidators(Validators.required);
        this.form.get('password')?.updateValueAndValidity();
      }
    });
  }

  loadUser(id: number) {
    this.isLoading.set(true);
    // Since we don't have getSingleUser API, we'll fetch all and find
    // In a real app, we should have a getSingleUser endpoint
    this.authService.getUsers().subscribe({
      next: (users) => {
        const user = users.find(u => u.id === id);
        if (user) {
          this.form.patchValue({
            name: user.name,
            email: user.email,
            role: user.role
          });
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading user', err);
        this.isLoading.set(false);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    const formData = this.form.value;

    if (this.isEditMode() && this.userId) {
      // For update, exclude password if empty
      const updateData: any = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      this.authService.updateUser(this.userId, updateData).subscribe({
        next: () => {
          this.router.navigate(['/admin/users']);
        },
        error: (err) => {
          console.error('Error updating user', err);
          this.isLoading.set(false);
        }
      });
    } else {
      // Register new user (using Auth Register endpoint or a dedicated Create User endpoint if available)
      // Since we only have Register, we'll use that. Note: Register usually logs in the user, 
      // but here we are admin creating another user. 
      // Ideally backend should have AdminCreateUser. We will use Register for now.

      this.authService.register(formData).subscribe({
        next: () => {
          this.router.navigate(['/admin/users']);
        },
        error: (err) => {
          console.error('Error creating user', err);
          this.isLoading.set(false);
        }
      });
    }
  }
}
