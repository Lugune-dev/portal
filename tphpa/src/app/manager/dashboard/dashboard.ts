import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth/auth';
import { ReportService, Report } from '../../services/report.service';
import { FormsService, FormSubmission } from '../../services/forms.service';
import { ChangePasswordComponent } from '../../features/auth/change-password/change-password';

enum ActiveView {
  Dashboard = 'dashboard',
  Queue = 'queue',
  Workload = 'workload',
  Forms = 'forms',
  ChangePassword = 'change-password'
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ChangePasswordComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  activeView: string = 'dashboard';
  managerQueue: Report[] = [];
  subordinateWorkload: any[] = [];
  subordinateForms: FormSubmission[] = [];

  // Properties for the approval modal/form
  selectedReport: Report | null = null;
  selectedForm: FormSubmission | null = null;
  approvalComment: string = '';

  constructor(
    private authService: AuthService,
    private reportService: ReportService,
    private formsService: FormsService,
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
        this.managerQueue = [];
        this.subordinateWorkload = [];
        this.subordinateForms = [];
      }
    });
  }

  get userName(): string | null {
    return this.authService.getFullName();
  }

  get userUnitName(): string {
      // In a real app, fetch this from a UnitService using this.authService.getOrgUnitId()
      return 'Plant Quarantine Section';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    const name = this.userName;
    if (!name) return 'M';
    const parts = name.split(' ');
    const first = parts[0] ? parts[0][0] : '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase().slice(0, 2);
  }



  getViewTitle(): string {
    const titles: { [key: string]: string } = {
      'dashboard': 'Manager Dashboard',
      'queue': 'Approval Queue',
      'workload': 'Staff Workload Tracker',
      'forms': 'Form Approvals',
      'change-password': 'Change Password',
    };
    return titles[this.activeView] || 'Manager Portal';
  }

  getTotalReports(): number {
    return this.subordinateWorkload.reduce((sum: number, item: any) => sum + item.totalReports, 0);
  }

  // --- Data Loading ---

  loadDashboardData(): void {
    const managerUnitId = this.authService.getOrgUnitId();
    const userId = this.authService.getUserId();

    if (managerUnitId) {
      // 1. Load the reports requiring this manager's first-level approval
      this.reportService.getManagerApprovalQueue(managerUnitId).subscribe((reports: Report[]) => {
          this.managerQueue = reports;
      });

      // 2. Load the summary of staff work in this unit
      this.reportService.getSubordinateWorkload(managerUnitId).subscribe((workload: any[]) => {
          this.subordinateWorkload = workload;
      });
    }

    if (userId) {
      // 3. Load subordinate forms for approval
      this.formsService.getSubordinateForms(userId).subscribe((response) => {
        if (response.success) {
          this.subordinateForms = response.data;
        }
      });
    }
  }

  // --- Approval Logic ---

  openApprovalModal(report: Report): void {
      this.selectedReport = report;
      this.selectedForm = null;
      this.approvalComment = '';
      // In a real app, you'd show a modal here
      console.log('Opening approval form for report:', report.id);
      this.activeView = 'queue';
  }

  openFormApprovalModal(form: FormSubmission): void {
      this.selectedForm = form;
      this.selectedReport = null;
      this.approvalComment = '';
      console.log('Opening approval form for form:', form.id);
      this.activeView = 'forms';
  }

  processApproval(action: 'approve' | 'reject'): void {
    if (this.selectedReport) {
      this.processReportApproval(action);
    } else if (this.selectedForm) {
      this.processFormApproval(action);
    }
  }

  processReportApproval(action: 'approve' | 'reject'): void {
    if (!this.selectedReport) return;

    const reportId = this.selectedReport.id;
    let serviceCall: Observable<any>;

    if (action === 'approve') {
        serviceCall = this.reportService.approveReport(reportId, this.approvalComment);
    } else {
        // Rejection requires a reason (comment)
        if (!this.approvalComment || this.approvalComment.length < 5) {
            alert('Rejection requires a detailed reason.');
            return;
        }
        serviceCall = this.reportService.rejectReport(reportId, this.approvalComment);
    }

    serviceCall.subscribe({
        next: () => {
            alert(`Report ${reportId} successfully ${action}d.`);
            this.selectedReport = null; // Close modal/form
            this.loadDashboardData(); // Refresh data
            this.activeView = 'dashboard';
        },
        error: (err) => {
            console.error(`${action} failed:`, err);
            alert(`Failed to process ${action}.`);
        }
    });
  }

  processFormApproval(action: 'approve' | 'reject'): void {
    if (!this.selectedForm) return;

    const formId = this.selectedForm.id;
    const userId = this.authService.getUserId();
    if (!userId) {
      alert('User ID not found. Please log in again.');
      return;
    }
    let serviceCall: Observable<any>;

    if (action === 'approve') {
        serviceCall = this.formsService.approveForm(formId, this.approvalComment, userId);
    } else {
        // Rejection requires a reason (comment)
        if (!this.approvalComment || this.approvalComment.length < 5) {
            alert('Rejection requires a detailed reason.');
            return;
        }
        serviceCall = this.formsService.rejectForm(formId, this.approvalComment, userId);
    }

    serviceCall.subscribe({
        next: () => {
            alert(`Form ${formId} successfully ${action}d.`);
            this.selectedForm = null; // Close modal/form
            this.loadDashboardData(); // Refresh data
            this.activeView = 'dashboard';
        },
        error: (err) => {
            console.error(`${action} failed:`, err);
            alert(`Failed to process ${action}.`);
        }
    });
  }

  public setActiveView(view: string): void {
    this.activeView = view;
  }
}
