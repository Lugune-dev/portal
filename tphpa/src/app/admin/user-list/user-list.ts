import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

interface User {
  UserID: number;
  Email: string;
  FirstName: string;
  LastName: string;
  UserRoleID: number;
  OrgUnitID: number;
  UnitName?: string;
}

interface UserRole {
  value: number;
  viewValue: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  editForm: FormGroup;
  selectedUser: User | null = null;
  showEditModal: boolean = false;
  loading: boolean = false;

  roles: UserRole[] = [
    { value: 1, viewValue: 'Admin' },
    { value: 2, viewValue: 'Director' },
    { value: 3, viewValue: 'Manager' },
    { value: 4, viewValue: 'User' }
  ];

  sidebarItems: any[] = [
    { icon: 'fas fa-tachometer-alt', label: 'Dashboard', active: false, route: '/admin/dashboard' },
    { icon: 'fas fa-bullhorn', label: 'Advertisements', active: false, route: '/admin/advertisements' },
    { icon: 'fas fa-users', label: 'User List', active: true, route: '/admin/user-list' },
    { icon: 'fas fa-user-plus', label: 'Register User', active: false, route: '/admin/user-registration' },
    { icon: 'fas fa-chart-bar', label: 'Reports', active: false, route: '/admin/reports' },
    { icon: 'fas fa-cog', label: 'Settings', active: false, route: '/admin/settings' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.editForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      userRoleID: ['', Validators.required],
      orgUnitID: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<{ success: boolean; data: User[] }>('/api/users', { headers })
      .subscribe({
        next: (response) => {
          this.users = response.data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load users', err);
          this.loading = false;
        }
      });
  }

  openEditModal(user: User): void {
    this.selectedUser = user;
    this.editForm.patchValue({
      email: user.Email,
      firstName: user.FirstName,
      lastName: user.LastName,
      userRoleID: user.UserRoleID,
      orgUnitID: user.OrgUnitID
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;
    this.editForm.reset();
  }

  onEditSubmit(): void {
    if (this.editForm.invalid || !this.selectedUser) {
      this.editForm.markAllAsTouched();
      return;
    }

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.put(`/api/users/${this.selectedUser.UserID}`, this.editForm.value, { headers })
      .subscribe({
        next: (response: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'User updated successfully',
          });
          this.closeEditModal();
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error updating user:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update user',
          });
        }
      });
  }

  deleteUser(user: User): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete user ${user.FirstName} ${user.LastName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem('auth_token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.delete(`/api/users/${user.UserID}`, { headers })
          .subscribe({
            next: (response: any) => {
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'User has been deleted.',
              });
              this.loadUsers();
            },
            error: (err) => {
              console.error('Error deleting user:', err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to delete user',
              });
            }
          });
      }
    });
  }

  setActiveSidebar(item: any): void {
    this.sidebarItems.forEach(i => i.active = false);
    item.active = true;
  }

  logout(): void {
    this.router.navigate(['/login']);
  }

  getRoleName(userRoleID: number): string {
    const role = this.roles.find(r => r.value === userRoleID);
    return role ? role.viewValue : 'Unknown';
  }

  getRoleBadgeClass(userRoleID: number): string {
    switch (userRoleID) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-blue-100 text-blue-800';
      case 4: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
