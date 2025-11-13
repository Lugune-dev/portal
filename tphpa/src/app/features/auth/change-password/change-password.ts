import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.css'],
})
export class ChangePasswordComponent {
  changePasswordForm!: FormGroup;
  isLoading = false;
  message = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.initializeForm();
  }

  initializeForm(): void {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup): any {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.message = '';

    const { currentPassword, newPassword } = this.changePasswordForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.message = 'Password changed successfully!';
          this.changePasswordForm.reset();
        } else {
          this.message = response.message || 'Failed to change password.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.message = 'An error occurred. Please try again.';
        console.error('Change password error:', err);
      }
    });
  }

  onBack(): void {
    // Emit event to parent to go back to dashboard
    // This will be handled by the parent component
  }
}
