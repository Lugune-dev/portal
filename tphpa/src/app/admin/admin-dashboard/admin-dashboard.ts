import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface OverviewCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
  trendValue?: string;
  progress?: number;
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
  category: string;
  time: string;
  details?: string;
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
  imports: [CommonModule, NgForOf, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  constructor(private http: HttpClient) {}

  searchTerm: string = '';
  sidebarItems: SidebarItem[] = [
    { icon: 'fas fa-tachometer-alt', label: 'Dashboard', active: true, route: '/admin/dashboard' },
    { icon: 'fas fa-bullhorn', label: 'Advertisements', active: false, route: '/admin/advertisements' },
    { icon: 'fas fa-users', label: 'User List', active: false, route: '/admin/user-list' },
    { icon: 'fas fa-user-plus', label: 'Register User', active: false, route: '/admin/user-registration' },
    { icon: 'fas fa-chart-bar', label: 'Reports', active: false, route: '/admin/reports' },
    { icon: 'fas fa-cog', label: 'Settings', active: false, route: '/admin/settings' }
  ];

  overviewCards: OverviewCard[] = [
    { title: 'Total Users', value: '0', icon: 'fas fa-users', color: '#26A69A' },
    { title: 'Active Ads', value: '0', icon: 'fas fa-bullhorn', color: '#4CAF50' },
    { title: 'Reports Generated', value: '0', icon: 'fas fa-chart-bar', color: '#FF9800' },
    { title: 'Forms Submitted', value: '0', icon: 'fas fa-file-alt', color: '#9C27B0' }
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

  recentActivities: RecentActivity[] = [];

  filteredActivities: RecentActivity[] = [...this.recentActivities];

  staffCount = 16;
  invoiceCount = 12;

  ngOnInit(): void {
    // Subscribe to auth state to load data when user is authenticated
    // For admin, we can assume it's always authenticated or handle differently
    this.loadOverviewData();
    this.loadRecentActivities();
  }

  loadOverviewData(): void {
    // Fetch total users
    this.http.get('/api/users').subscribe((res: any) => {
      if (res.success) {
        this.overviewCards[0].value = res.data.length.toString();
      }
    });

    // Fetch active ads
    this.http.get('https://portal-api-z927.onrender.com/').subscribe((res: any) => {
      if (res.success) {
        const activeAds = res.data.filter((ad: any) => ad.isActive).length;
        this.overviewCards[1].value = activeAds.toString();
      }
    });

    // Fetch reports count
    this.http.get('/api/reports').subscribe((res: any) => {
      if (res.success) {
        this.overviewCards[2].value = res.data.length.toString();
      }
    });

    // Fetch forms count
    this.http.get('/api/forms').subscribe((res: any) => {
      if (res.success) {
        this.overviewCards[3].value = res.data.length.toString();
      }
    });
  }

  loadRecentActivities(): void {
    // Fetch recent reports as activities
    this.http.get('/api/reports').subscribe((res: any) => {
      if (res.success) {
        const reportActivities = res.data.slice(0, 3).map((report: any) => ({
          activity: report.title,
          date: new Date(report.submitted_date).toLocaleDateString(),
          user: report.submitter_name,
          status: report.status,
          category: 'Reports',
          time: new Date(report.submitted_date).toLocaleTimeString(),
          details: report.comments || 'Report submitted'
        }));

        // Fetch recent form submissions
        this.http.get('/api/forms').subscribe((formsRes: any) => {
          if (formsRes.success) {
            const formActivities = formsRes.data.slice(0, 2).map((form: any) => ({
              activity: 'Application Submitted',
              date: new Date(form.created_at).toLocaleDateString(),
              user: form.FirstName + ' ' + form.LastName,
              status: 'Completed',
              category: 'Forms',
              time: new Date(form.created_at).toLocaleTimeString(),
              details: `${form.form_type_name || 'Form'} submitted`
            }));

            // Combine and sort activities by date
            this.recentActivities = [...reportActivities, ...formActivities]
              .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
              .slice(0, 5);

            this.filteredActivities = [...this.recentActivities];
          }
        });
      }
    });
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

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'User Management': '#2196F3',
      'Advertising': '#FF5722',
      'Reports': '#4CAF50',
      'Security': '#9C27B0',
      'Forms': '#FF9800',
      'Maintenance': '#607D8B'
    };
    return colors[category] || '#26A69A';
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'User Management': 'fas fa-user',
      'Advertising': 'fas fa-bullhorn',
      'Reports': 'fas fa-chart-bar',
      'Security': 'fas fa-shield-alt',
      'Forms': 'fas fa-file-alt',
      'Maintenance': 'fas fa-tools'
    };
    return icons[category] || 'fas fa-circle';
  }

  getCategoryClass(category: string): string {
    const classes: { [key: string]: string } = {
      'User Management': 'bg-blue-100 text-blue-800',
      'Advertising': 'bg-red-100 text-red-800',
      'Reports': 'bg-green-100 text-green-800',
      'Security': 'bg-purple-100 text-purple-800',
      'Forms': 'bg-orange-100 text-orange-800',
      'Maintenance': 'bg-gray-100 text-gray-800'
    };
    return classes[category] || 'bg-gray-100 text-gray-800';
  }
}
