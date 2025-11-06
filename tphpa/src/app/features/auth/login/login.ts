// login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';
import { LanguageService } from '../../../services/language.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  loginError: string | null = null;
  showPassword: boolean = false;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public languageService: LanguageService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.loginError = null;
    this.isLoading = true;

    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password)
        .subscribe({
          next: (response: any) => {
            this.isLoading = false;

            const userRoleID = response.user.UserRoleID;
            console.log(`User logged in with Role ID: ${userRoleID}`);

            // Add success animation delay
            setTimeout(() => {
              switch (userRoleID) {
                case 1: // admin
                  this.router.navigate(['/admin/dashboard']);
                  break;

                case 2: // Director General
                  this.router.navigate(['/director-general/dashboard']);
                  break;

                case 3: // Director
                  this.router.navigate(['/director/dashboard']);
                  break;
                case 4: // Manager
                  this.router.navigate(['/manager/dashboard']);
                  break;
                case 5: // Staff Officer
                case 6: // Support Staff
                  this.router.navigate(['/employee/dashboard']);
                  break;
                default:
                  this.router.navigate(['/']);
                  break;
              }
            }, 500);

            this.loginForm.reset();
            this.submitted = false;

          },
          error: (err: any) => {
            this.isLoading = false;
            console.error('Login failed:', err);
            this.loginError = err.error?.message || 'Login failed. Please check your credentials.';

            // Reset only password field on failure
            this.loginForm.patchValue({
              email: email,
              password: ''
            });
            this.submitted = false;
            this.loginForm.controls['password'].markAsPristine();
            this.loginForm.controls['password'].markAsUntouched();
          }
        });
    } else {
      this.isLoading = false;
    }
  }

  // Helper method to check field validity
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!field && (field.invalid && field.touched) || (this.submitted && field!.invalid);
  }
}
