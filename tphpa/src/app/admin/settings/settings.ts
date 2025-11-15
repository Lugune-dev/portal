import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface User {
  UserID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  UserRoleID: number;
  OrgUnitID: number;
  UnitName?: string;
}

interface Advertisement {
  id: number;
  title: string;
  description: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  imagePath?: string;
}

interface Report {
  id: number;
  title: string;
  submitter_name: string;
  submitter_unit_id: number;
  type: string;
  submitted_date: string;
  status: string;
  comments: string;
}

interface FormSubmission {
  id: number;
  instance_id: string;
  action_type: string;
  action_by: number;
  comments: string;
  form_data: string;
  created_at: string;
  FirstName: string;
  LastName: string;
  Email: string;
  UnitName: string;
  form_type_name?: string;
  form_type_code?: string;
}

interface SidebarItem {
  icon: string;
  label: string;
  active: boolean;
  route: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterModule],
  templateUrl: './settings.html'
})
export class SettingsComponent implements OnInit {
  activeTab: string = 'users';
  users: User[] = [];
  advertisements: Advertisement[] = [];
  reports: Report[] = [];
  applications: FormSubmission[] = [];

  editingUser: User | null = null;
  editingAd: Advertisement | null = null;

  sidebarItems: SidebarItem[] = [
    { icon: 'fas fa-tachometer-alt', label: 'Dashboard', active: false, route: '/admin/dashboard' },
    { icon: 'fas fa-bullhorn', label: 'Advertisements', active: false, route: '/admin/advertisements' },
    { icon: 'fas fa-users', label: 'User List', active: false, route: '/admin/user-list' },
    { icon: 'fas fa-user-plus', label: 'Register User', active: false, route: '/admin/user-registration' },
    { icon: 'fas fa-chart-bar', label: 'Reports', active: false, route: '/admin/reports' },
    { icon: 'fas fa-cog', label: 'Settings', active: true, route: '/admin/settings' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadAdvertisements();
    this.loadReports();
    this.loadApplications();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  loadUsers(): void {
    this.http.get('https://portal-api-z927.onrender.com/api/users').subscribe((res: any) => {
      if (res.success) {
        this.users = res.data;
      }
    });
  }

  loadAdvertisements(): void {
    this.http.get('https://portal-api-z927.onrender.com/api/advertsements').subscribe((res: any) => {
      if (res.success) {
        this.advertisements = res.data;
      }
    });
  }

  loadReports(): void {
    this.http.get('https://portal-api-z927.onrender.com/api/reports').subscribe((res: any) => {
      if (res.success) {
        this.reports = res.data;
      }
    });
  }

  loadApplications(): void {
    this.http.get('https://portal-api-z927.onrender.com/api/forms').subscribe((res: any) => {
      if (res.success) {
        this.applications = res.data;
      }
    });
  }

  editUser(user: User): void {
    this.editingUser = { ...user };
  }

  saveUser(): void {
    if (this.editingUser) {
      this.http.put(`https://portal-api-z927.onrender.com/api/users/${this.editingUser.UserID}`, this.editingUser).subscribe(() => {
        this.loadUsers();
        this.editingUser = null;
      });
    }
  }

  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.http.delete(`https://portal-api-z927.onrender.com/api/users/${userId}`).subscribe(() => {
        this.loadUsers();
      });
    }
  }

  editAd(ad: Advertisement): void {
    this.editingAd = { ...ad };
  }

  saveAd(): void {
    if (this.editingAd) {
      this.http.put(`https://portal-api-z927.onrender.com/api/advertsements/api/advertisements/${this.editingAd.id}`, this.editingAd).subscribe(() => {
        this.loadAdvertisements();
        this.editingAd = null;
      });
    }
  }

  deleteAd(adId: number): void {
    if (confirm('Are you sure you want to delete this advertisement?')) {
      this.http.delete(`https://portal-api-z927.onrender.com/api/advertsements/api/advertisements/${adId}`).subscribe(() => {
        this.loadAdvertisements();
      });
    }
  }

  getRoleName(roleId: number): string {
    const roles: { [key: number]: string } = {
      1: 'Admin',
      2: 'Director General',
      3: 'Director',
      4: 'Manager',
      5: 'Employee',
      6: 'Employee'
    };
    return roles[roleId] || 'Unknown';
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'sent_to_director': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  setActiveSidebar(item: SidebarItem): void {
    this.sidebarItems.forEach(i => i.active = false);
    item.active = true;
  }

  logout(): void {
    // Implement logout logic
    console.log('Logout clicked');
  }

  getGradient(color: string): string {
    const gradients: { [key: string]: string } = {
      '#26A69A': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '#4CAF50': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      '#FF9800': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      '#9C27B0': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      '#2196F3': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '#FF5722': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      '#607D8B': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    };
    return gradients[color] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
}
