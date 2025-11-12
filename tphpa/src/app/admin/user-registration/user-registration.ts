import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';


interface UserRole {
  value: string;
  viewValue: string;
}

interface ReportsTo {
  id: number;
  name: string;
}

@Component({
  selector: 'app-user-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './user-registration.html',
  styleUrls: ['./user-registration.css']
})
export class UserRegistrationComponent implements OnInit {
  userForm: FormGroup;
  roles: UserRole[] = [
    { value: 'admin', viewValue: 'Admin' },
    { value: 'director_general', viewValue: 'Director General' },
    { value: 'director', viewValue: 'Director' },
    { value: 'manager', viewValue: 'Manager' },
    { value: 'staff_officer', viewValue: 'Staff Officer' },
    { value: 'support_officer', viewValue: 'Support Officer' }
  ];
  reportsToUsers: ReportsTo[] = [];
  errorMessage: string | null = null;
  loading: boolean = false;

  sidebarItems: any[] = [
    { icon: 'fas fa-tachometer-alt', label: 'Dashboard', active: false, route: '/admin/dashboard' },
    { icon: 'fas fa-bullhorn', label: 'Advertisements', active: false, route: '/admin/advertisements' },
    { icon: 'fas fa-users', label: 'User List', active: false, route: '/admin/user-list' },
    { icon: 'fas fa-user-plus', label: 'Register User', active: true, route: '/admin/user-registration' },
    { icon: 'fas fa-chart-bar', label: 'Reports', active: false, route: '/admin/reports' },
    { icon: 'fas fa-cog', label: 'Settings', active: false, route: '/admin/settings' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      title: [''],
      directorate: [''],
      unit: [''],
      role: ['', Validators.required],
      reports_to_id: [null]
    });
  }

  ngOnInit(): void {
    this.fetchReportsToUsers();
  }

  fetchReportsToUsers(): void {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<ReportsTo[]>('/api/admin/reports-to', { headers })
      .subscribe({
        next: (data) => {
          this.reportsToUsers = data;
        },
        error: (err) => {
          console.error('Failed to fetch reports-to list', err);
          this.errorMessage = 'Failed to load supervisor list.';
        }
      });
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.loading = true;

    if (this.userForm.invalid) {
      this.loading = false;
      this.userForm.markAllAsTouched();
      return;
    }

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post('/api/admin/register-user', this.userForm.value, { headers })
      .subscribe({
        next: (response: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: response.message,
          });
          this.userForm.reset();
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'User registration failed.';
          this.loading = false;
        }
      });
  }

  setActiveSidebar(item: any): void {
    this.sidebarItems.forEach(i => i.active = false);
    item.active = true;
  }

  logout(): void {
    // Implement logout logic
    this.router.navigate(['/login']);
  }
}
