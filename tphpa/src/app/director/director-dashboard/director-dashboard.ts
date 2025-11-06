import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs'; // Import for Mock Services

// --- Placeholder Service and Interface Definitions ---

export interface FinalApprovalReport {
  id: number;
  title: string;
  submitterName: string; 
  submitterUnit: string; // The staff member's unit
  managerName: string; // The manager who reviewed it
  type: string;
  submittedDate: string;
  status: 'SENT_TO_DIRECTOR' | 'FINAL_APPROVED' | 'DIRECTOR_REJECTED';
}

export interface Metric {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

// Mock services reflecting the Director's high-level access
class AuthService {
    getUserName(): string | null { return 'Dr. Elizabeth Mwenda'; }
    getUserId(): number { return 1; } // Mock User ID
    getUserRoleName(): string | null { return 'Director'; }
    getFullName(): string | null { return 'Dr. Elizabeth Mwenda'; }

    logout(): void { console.log('Director logged out.'); }
}

class ReportService {
    // CRITICAL: Fetches reports that are already Manager-approved (e.g., status 'SENT_TO_DIRECTOR')
    getDirectorApprovalQueue(): Observable<FinalApprovalReport[]> {
        console.log(`Fetching reports for final Director approval.`);
        // Mock data for Director
        return of([
            {
                id: 501,
                title: 'Q3 Safari Imprest for Audit Team',
                submitterName: 'Simon Kalinga',
                submitterUnit: 'Finance & Audit',
                managerName: 'Jane Doe',
                type: 'FINANCE',
                submittedDate: '2025-10-20',
                status: 'SENT_TO_DIRECTOR',
            },
            {
                id: 502,
                title: 'High-Value Equipment Purchase Request',
                submitterName: 'Zawadi Musa',
                submitterUnit: 'Infrastructure',
                managerName: 'John Smith',
                type: 'PURCHASE',
                submittedDate: '2025-10-22',
                status: 'SENT_TO_DIRECTOR',
            },
        ]);
    }

    getDirectorMetrics(): Observable<Metric[]> {
        return of([
            { title: 'Total Reports Processed (QTD)', value: 452, icon: 'fas fa-chart-line', color: 'primary' },
            { title: 'Avg. Approval Time (Days)', value: 1.8, icon: 'fas fa-clock', color: 'info' },
            { title: 'Units Submitting Reports', value: 7, icon: 'fas fa-building', color: 'success' },
            { title: 'Budget Utilisation (%)', value: '75.2%', icon: 'fas fa-money-check-alt', color: 'warning' },
        ]);
    }

    finalApproveReport(reportId: number, comment: string): Observable<any> {
        console.log(`Report ${reportId} given final approval by Director. Comment: ${comment}`);
        return of({ success: true });
    }
    
    finalRejectReport(reportId: number, comment: string): Observable<any> {
        console.log(`Report ${reportId} rejected by Director. Comment: ${comment}`);
        return of({ success: true });
    }
}
// --- End of Placeholder Definitions ---

@Component({
  selector: 'app-director-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './director-dashboard.html',
  styleUrls: ['./director-dashboard.css'],
  providers: [
      { provide: AuthService, useClass: AuthService },
      { provide: ReportService, useClass: ReportService }
  ]
})
export class DirectorDashboardComponent implements OnInit {
  activeView: string = 'dashboard';
  approvalQueue: FinalApprovalReport[] = [];
  metrics: Metric[] = [];
  
  // Properties for the final approval form
  selectedReport: FinalApprovalReport | null = null;
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
    if (!name) return 'D';
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
    };
    return gradients[color] || gradients['primary'];
  }

  public setActiveView(view: string): void {
    this.activeView = view;
  }

  public getViewTitle(): string {
    const titles: { [key: string]: string } = {
      'dashboard': 'Executive Overview',
      'queue': 'Final Approval Queue',
      'metrics': 'Performance Metrics',
    };
    return titles[this.activeView] || 'Director Portal';
  }

  // --- Data Loading ---

  loadDashboardData(): void {
    // 1. Load the final reports requiring Director's approval
    this.reportService.getDirectorApprovalQueue().subscribe(reports => {
        this.approvalQueue = reports;
    });
    
    // 2. Load key performance indicators
    this.reportService.getDirectorMetrics().subscribe(metrics => {
        this.metrics = metrics;
    });
  }
  
  // --- Approval Logic ---

  public openApprovalForm(report: FinalApprovalReport): void {
      this.selectedReport = report;
      this.approvalComment = '';
      this.setActiveView('queue');
  }

  public processFinalApproval(action: 'approve' | 'reject'): void {
    if (!this.selectedReport) return;

    const reportId = this.selectedReport.id;
    let serviceCall: Observable<any>;

    if (action === 'approve') {
        serviceCall = this.reportService.finalApproveReport(reportId, this.approvalComment);
    } else {
        if (!this.approvalComment || this.approvalComment.length < 10) {
            alert('Director-level rejection requires a detailed and substantial reason.');
            return;
        }
        serviceCall = this.reportService.finalRejectReport(reportId, this.approvalComment);
    }
    
    serviceCall.subscribe({
        next: () => {
            alert(`Report ${reportId} successfully ${action}d.`);
            this.selectedReport = null; // Close form
            this.loadDashboardData(); // Refresh data
            this.setActiveView('dashboard');
        },
        error: (err) => {
            console.error(`${action} failed:`, err);
            alert(`Failed to process ${action}.`);
        }
    });
  }
}