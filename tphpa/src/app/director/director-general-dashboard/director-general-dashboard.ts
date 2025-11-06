import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';

// --- Placeholder Service and Interface Definitions ---

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

// Mock services reflecting the DG's absolute authority and organization-wide oversight
class AuthService {
    getUserName(): string | null { return 'Dr. Amina Hassan'; }
    getUserId(): number { return 1; }
    getUserRoleName(): string | null { return 'Director General'; }
    getFullName(): string | null { return 'Dr. Amina Hassan'; }

    logout(): void { console.log('Director General logged out.'); }
}

class ReportService {
    // DG has access to ALL critical items across the organization, regardless of prior approvals
    getCriticalItemsForAbsoluteApproval(): Observable<CriticalItem[]> {
        console.log(`Fetching all critical items for DG absolute approval.`);
        return of([
            {
                id: 1001,
                title: 'National Budget Allocation Review',
                submitterName: 'Finance Director',
                submitterUnit: 'Finance & Audit',
                managerName: 'Jane Doe',
                type: 'BUDGET',
                submittedDate: '2025-10-25',
                status: 'CRITICAL_PENDING',
                priority: 'CRITICAL',
                details: 'Comprehensive review of national budget allocations requiring DG approval.'
            },
            {
                id: 1002,
                title: 'Emergency Infrastructure Project',
                submitterName: 'Infrastructure Head',
                submitterUnit: 'Infrastructure',
                type: 'INFRASTRUCTURE',
                submittedDate: '2025-10-26',
                status: 'CRITICAL_PENDING',
                priority: 'HIGH',
                details: 'High-priority emergency infrastructure project bypassing standard approvals.'
            },
            {
                id: 1003,
                title: 'Policy Reform Initiative',
                submitterName: 'Policy Advisor',
                submitterUnit: 'Policy & Planning',
                managerName: 'John Smith',
                type: 'POLICY',
                submittedDate: '2025-10-24',
                status: 'ABSOLUTE_APPROVED',
                priority: 'CRITICAL',
                details: 'Major policy reform requiring absolute DG authority.'
            },
        ]);
    }

    getOrganizationWideMetrics(): Observable<OrgWideMetric[]> {
        return of([
            { title: 'Total Organization Budget (Annual)', value: 'KSh 2.5B', icon: 'fas fa-money-bill-wave', color: 'primary', trend: '+5.2%' },
            { title: 'Active Directorates', value: 12, icon: 'fas fa-building', color: 'info', trend: 'Stable' },
            { title: 'Critical Items Processed (QTD)', value: 89, icon: 'fas fa-exclamation-triangle', color: 'warning', trend: '+12%' },
            { title: 'Overall Performance Score', value: '94.7%', icon: 'fas fa-trophy', color: 'success', trend: '+2.1%' },
            { title: 'Staff Headcount', value: 1547, icon: 'fas fa-users', color: 'secondary', trend: '+3.5%' },
            { title: 'Compliance Rate', value: '98.2%', icon: 'fas fa-shield-alt', color: 'danger', trend: '+0.8%' },
        ]);
    }

    absoluteApproveItem(itemId: number, comment: string): Observable<any> {
        console.log(`Item ${itemId} granted absolute approval by DG. Comment: ${comment}`);
        return of({ success: true });
    }

    absoluteRejectItem(itemId: number, comment: string): Observable<any> {
        console.log(`Item ${itemId} absolutely rejected by DG. Comment: ${comment}`);
        return of({ success: true });
    }
}
// --- End of Placeholder Definitions ---

@Component({
  selector: 'app-director-general-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './director-general-dashboard.html',
  styleUrls: ['./director-general-dashboard.css'],
  providers: [
      { provide: AuthService, useClass: AuthService },
      { provide: ReportService, useClass: ReportService }
  ]
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
    this.reportService.getCriticalItemsForAbsoluteApproval().subscribe(items => {
        this.criticalItems = items;
    });

    // 2. Load organization-wide aggregated metrics
    this.reportService.getOrganizationWideMetrics().subscribe(metrics => {
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
    let serviceCall: Observable<any>;

    if (action === 'approve') {
        serviceCall = this.reportService.absoluteApproveItem(itemId, this.approvalComment);
    } else {
        if (!this.approvalComment || this.approvalComment.length < 10) {
            alert('Absolute rejection requires a detailed and substantial rationale.');
            return;
        }
        serviceCall = this.reportService.absoluteRejectItem(itemId, this.approvalComment);
    }

    serviceCall.subscribe({
        next: () => {
            alert(`Item ${itemId} successfully ${action}d with absolute authority.`);
            this.selectedItem = null; // Close form
            this.loadDashboardData(); // Refresh data
            this.setActiveView('oversight');
        },
        error: (err) => {
            console.error(`${action} failed:`, err);
            alert(`Failed to process absolute ${action}.`);
        }
    });
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
