// forgot-password.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';
import { LanguageService } from '../../../services/language.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule, TranslatePipe],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  submitted = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public languageService: LanguageService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true;

    if (this.forgotPasswordForm.valid) {
      const { email } = this.forgotPasswordForm.value;

      // Assuming authService has a forgotPassword method
      this.authService.forgotPassword(email)
        .subscribe({
          next: (response: any) => {
            this.isLoading = false;
            this.successMessage = response.message || 'Password reset instructions have been sent to your email.';
            this.forgotPasswordForm.reset();
            this.submitted = false;
          },
          error: (err: any) => {
            this.isLoading = false;
            console.error('Forgot password failed:', err);
            this.errorMessage = err.error?.message || 'Failed to send reset instructions. Please try again.';
            this.submitted = false;
          }
        });
    } else {
      this.isLoading = false;
    }
  }

  // Helper method to check field validity
  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!field && (field.invalid && field.touched) || (this.submitted && field!.invalid);
  }

  goBackToLogin(): void {
    this.router.navigate(['/login']);
  }
}
