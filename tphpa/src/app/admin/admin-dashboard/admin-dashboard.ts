import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

interface OverviewCard {
  title: string;
  value: string;
  icon: string;
  color: string;
}

interface ManagementTool {
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

interface RecentActivity {
  activity: string;
  date: string;
  user: string;
  status: string;
}

interface SidebarItem {
  icon: string;
  label: string;
  active: boolean;
  route: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NgForOf, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  searchTerm: string = '';
  sidebarItems: SidebarItem[] = [
    { icon: 'fas fa-tachometer-alt', label: 'Dashboard', active: true, route: '/admin/dashboard' },
    { icon: 'fas fa-bullhorn', label: 'Advertisements', active: false, route: '/admin/advertisements' },
    { icon: 'fas fa-users', label: 'User List', active: false, route: '/admin/user-registration' },
    { icon: 'fas fa-chart-bar', label: 'Reports', active: false, route: '/admin/reports' }
  ];

  overviewCards: OverviewCard[] = [
    { title: 'Total Users', value: '1,247', icon: 'fas fa-users', color: '#26A69A' },
    { title: 'Active Ads', value: '89', icon: 'fas fa-bullhorn', color: '#4CAF50' },
    { title: 'Reports Generated', value: '156', icon: 'fas fa-chart-bar', color: '#FF9800' },
    { title: 'System Health', value: '98%', icon: 'fas fa-shield-alt', color: '#9C27B0' }
  ];

  managementTools: ManagementTool[] = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: 'fas fa-user-cog',
      color: '#2196F3',
      route: '/admin/user-registration'
    },
    {
      title: 'Advertisement Control',
      description: 'Create, edit, and manage system advertisements',
      icon: 'fas fa-ad',
      color: '#FF5722',
      route: '/admin/advertisements'
    },
    {
      title: 'Reports & Analytics',
      description: 'View system reports and performance metrics',
      icon: 'fas fa-chart-line',
      color: '#4CAF50',
      route: '/admin/reports'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: 'fas fa-cogs',
      color: '#607D8B',
      route: '/admin/settings'
    }
  ];

  recentActivities: RecentActivity[] = [
    { activity: 'User Registration', date: 'Oct 23, 2024', user: 'John Doe', status: 'Completed' },
    { activity: 'Ad Campaign Created', date: 'Oct 22, 2024', user: 'Jane Smith', status: 'Active' },
    { activity: 'Report Generated', date: 'Oct 21, 2024', user: 'Admin User', status: 'Completed' },
    { activity: 'User Permissions Updated', date: 'Oct 20, 2024', user: 'System', status: 'Completed' },
    { activity: 'Ad Review Pending', date: 'Oct 19, 2024', user: 'Mike Johnson', status: 'Pending' }
  ];

  filteredActivities: RecentActivity[] = [...this.recentActivities];

  staffCount = 16;
  invoiceCount = 12;

  ngOnInit(): void {
    this.filteredActivities = this.recentActivities;
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredActivities = [...this.recentActivities];
      return;
    }
    this.filteredActivities = this.recentActivities.filter(activity =>
      activity.activity.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      activity.status.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      activity.user.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  setActiveSidebar(item: SidebarItem): void {
    this.sidebarItems.forEach(i => i.active = false);
    item.active = true;
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'active':
        return 'status-in-progress';
      default:
        return 'status-default';
    }
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
