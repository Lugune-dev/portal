import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// --- Interface Definitions ---

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
  trend?: string;
}

// Import actual services
import { AuthService } from '../../services/auth/auth';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-director-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './director-dashboard.html',
  styleUrls: ['./director-dashboard.css']
  // No providers needed since services are provided in root
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
    // Load data immediately if already authenticated
    if (this.authService.isAuthenticated() && this.authService.getUserId()) {
      this.loadDashboardData();
    }

    // Subscribe to auth state changes to load data when user logs in
    this.authService.authState$.subscribe(isAuthenticated => {
      if (isAuthenticated && this.authService.getUserId()) {
        this.loadDashboardData();
      } else {
        // Clear data when not authenticated or user data not available
        this.approvalQueue = [];
        this.metrics = [];
      }
    });
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
    this.reportService.getDirectorQueue().subscribe((reports: any) => {
        this.approvalQueue = reports;
    });

    // 2. Load key performance indicators
    this.reportService.getDirectorMetrics().subscribe((metrics: any) => {
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

    if (action === 'approve') {
        this.reportService.directorApproveReport(reportId, this.approvalComment).subscribe({
            next: () => {
                alert(`Report ${reportId} successfully ${action}d.`);
                this.selectedReport = null; // Close form
                this.loadDashboardData(); // Refresh data
                this.setActiveView('dashboard');
            },
            error: (err: any) => {
                console.error(`${action} failed:`, err);
                alert(`Failed to process ${action}.`);
            }
        });
    } else {
        if (!this.approvalComment || this.approvalComment.length < 10) {
            alert('Director-level rejection requires a detailed and substantial reason.');
            return;
        }
        this.reportService.directorRejectReport(reportId, this.approvalComment).subscribe({
            next: () => {
                alert(`Report ${reportId} successfully ${action}d.`);
                this.selectedReport = null; // Close form
                this.loadDashboardData(); // Refresh data
                this.setActiveView('dashboard');
            },
            error: (err: any) => {
                console.error(`${action} failed:`, err);
                alert(`Failed to process ${action}.`);
            }
        });
    }
  }
}