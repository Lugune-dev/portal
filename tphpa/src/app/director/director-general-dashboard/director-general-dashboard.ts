import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// --- Interface Definitions ---

export interface CriticalItem {
  id: number;
  title: string;
  submitterName: string;
  submitterUnit: string;
  managerName?: string; // Optional, as DG can bypass manager approval
  type: string;
  submittedDate: string;
  status: 'CRITICAL_PENDING' | 'ABSOLUTE_APPROVED' | 'ABSOLUTE_REJECTED';
  priority: 'HIGH' | 'CRITICAL';
  details?: string;
}

export interface OrgWideMetric {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend: string;
}

// Import actual services
import { AuthService } from '../../services/auth/auth';
import { ReportService } from '../../services/report.service';
import { ChangePasswordComponent } from '../../features/auth/change-password/change-password';

@Component({
  selector: 'app-director-general-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ChangePasswordComponent],
  templateUrl: './director-general-dashboard.html',
  styleUrls: ['./director-general-dashboard.css']
  // No providers needed since services are provided in root
})
export class DirectorGeneralDashboardComponent implements OnInit {
  activeView: string = 'oversight';
  criticalItems: CriticalItem[] = [];
  metrics: OrgWideMetric[] = [];

  // Properties for absolute approval form
  selectedItem: CriticalItem | null = null;
  approvalComment: string = '';

  constructor(
    private authService: AuthService,
    private reportService: ReportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  get userName(): string | null {
    return this.authService.getFullName();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    const name = this.userName;
    if (!name) return 'DG';
    const parts = name.split(' ');
    const initials = parts.map(n => n[0]).join('').toUpperCase().slice(0, 3);
    return initials;
  }

  getGradient(color: string): string {
    const gradients: { [key: string]: string } = {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      success: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      secondary: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      danger: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    };
    return gradients[color] || gradients['primary'];
  }

  public setActiveView(view: string): void {
    this.activeView = view;
    this.approvalComment = '';
  }

  public getViewTitle(): string {
    const titles: { [key: string]: string } = {
      'oversight': 'Organization-Wide Oversight',
      'approvals': 'Absolute Final Approvals',
      'metrics': 'Aggregated Performance KPIs',
    };
    return titles[this.activeView] || 'Director General Portal';
  }

  // --- Data Loading ---

  loadDashboardData(): void {
    // 1. Load all critical items requiring DG's absolute approval
    this.reportService.getDGCriticalItems().subscribe((items: any) => {
        this.criticalItems = items;
    });

    // 2. Load organization-wide aggregated metrics
    this.reportService.getDGMetrics().subscribe((metrics: any) => {
        this.metrics = metrics;
    });
  }

  // --- Absolute Approval Logic ---

  public openAbsoluteApprovalForm(item: CriticalItem): void {
      this.selectedItem = item;
      this.approvalComment = '';
      this.setActiveView('approvals');
  }

  public processAbsoluteApproval(action: 'approve' | 'reject'): void {
    if (!this.selectedItem) return;

    const itemId = this.selectedItem.id;

    if (action === 'approve') {
        this.reportService.dgApproveItem(itemId, this.approvalComment).subscribe({
            next: () => {
                alert(`Item ${itemId} successfully ${action}d with absolute authority.`);
                this.selectedItem = null; // Close form
                this.loadDashboardData(); // Refresh data
                this.setActiveView('oversight');
            },
            error: (err: any) => {
                console.error(`${action} failed:`, err);
                alert(`Failed to process absolute ${action}.`);
            }
        });
    } else {
        if (!this.approvalComment || this.approvalComment.length < 10) {
            alert('Absolute rejection requires a detailed and substantial rationale.');
            return;
        }
        this.reportService.dgRejectItem(itemId, this.approvalComment).subscribe({
            next: () => {
                alert(`Item ${itemId} successfully ${action}d with absolute authority.`);
                this.selectedItem = null; // Close form
                this.loadDashboardData(); // Refresh data
                this.setActiveView('oversight');
            },
            error: (err: any) => {
                console.error(`${action} failed:`, err);
                alert(`Failed to process absolute ${action}.`);
            }
        });
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600 bg-red-100 border-red-300';
      case 'HIGH': return 'text-orange-600 bg-orange-100 border-orange-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ABSOLUTE_APPROVED': return 'text-green-600 bg-green-100';
      case 'ABSOLUTE_REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  }

  getCriticalPendingCount(): number {
    return this.criticalItems.filter(item => item.status === 'CRITICAL_PENDING').length;
  }

  getAbsoluteApprovedCount(): number {
    return this.criticalItems.filter(item => item.status === 'ABSOLUTE_APPROVED').length;
  }

  getTotalCriticalItemsCount(): number {
    return this.criticalItems.length;
  }
}
