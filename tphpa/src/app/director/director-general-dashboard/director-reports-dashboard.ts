import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';

// --- Placeholder Service and Interface Definitions ---

export interface Report {
  id: number;
  title: string;
  submitterName: string;
  submitterUnit: string;
  managerName: string;
  type: string;
  submittedDate: string;
  status: 'PENDING' | 'MANAGER_APPROVED' | 'DIRECTOR_APPROVED' | 'REJECTED';
  details?: string; // Optional detailed description
}

// Mock services
class AuthService {
    getUserName(): string | null { return 'Dr. Elizabeth Mwenda'; }
    getUserId(): number { return 1; }
    getUserRoleName(): string | null { return 'Director'; }
    getFullName(): string | null { return 'Dr. Elizabeth Mwenda'; }
    logout(): void { console.log('Director logged out.'); }
}

class ReportService {
    getAllReports(): Observable<Report[]> {
        console.log('Fetching all reports for Director review.');
        return of([
            {
                id: 501,
                title: 'Q3 Safari Imprest for Audit Team',
                submitterName: 'Simon Kalinga',
                submitterUnit: 'Finance & Audit',
                managerName: 'Jane Doe',
                type: 'FINANCE',
                submittedDate: '2025-10-20',
                status: 'MANAGER_APPROVED',
                details: 'Detailed report on Q3 safari imprest expenses.'
            },
            {
                id: 502,
                title: 'High-Value Equipment Purchase Request',
                submitterName: 'Zawadi Musa',
                submitterUnit: 'Infrastructure',
                managerName: 'John Smith',
                type: 'PURCHASE',
                submittedDate: '2025-10-22',
                status: 'DIRECTOR_APPROVED',
                details: 'Request for purchasing high-value equipment.'
            },
            {
                id: 503,
                title: 'Annual Budget Review',
                submitterName: 'Alice Johnson',
                submitterUnit: 'Finance & Audit',
                managerName: 'Jane Doe',
                type: 'FINANCE',
                submittedDate: '2025-10-15',
                status: 'REJECTED',
                details: 'Annual budget review report.'
            },
        ]);
    }
}
// --- End of Placeholder Definitions ---

@Component({
  selector: 'app-director-reports-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './director-reports-dashboard.html',
  styleUrls: ['./director-reports-dashboard.css'],
  providers: [
      { provide: AuthService, useClass: AuthService },
      { provide: ReportService, useClass: ReportService }
  ]
})
export class DirectorReportsDashboardComponent implements OnInit {
  reports: Report[] = [];
  filteredReports: Report[] = [];
  searchTerm: string = '';
  selectedStatus: string = '';
  selectedUnit: string = '';
  selectedReport: Report | null = null;

  constructor(
    private authService: AuthService,
    private reportService: ReportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReports();
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

  loadReports(): void {
    this.reportService.getAllReports().subscribe(reports => {
      this.reports = reports;
      this.filteredReports = [...reports];
    });
  }

  applyFilters(): void {
    this.filteredReports = this.reports.filter(report => {
      const matchesSearch = !this.searchTerm ||
        report.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        report.submitterName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = !this.selectedStatus || report.status === this.selectedStatus;
      const matchesUnit = !this.selectedUnit || report.submitterUnit === this.selectedUnit;
      return matchesSearch && matchesStatus && matchesUnit;
    });
  }

  viewReportDetails(report: Report): void {
    this.selectedReport = report;
  }

  closeDetails(): void {
    this.selectedReport = null;
  }

  navigateToMainDashboard(): void {
    this.router.navigate(['/director/dashboard']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'DIRECTOR_APPROVED': return 'text-green-600 bg-green-100';
      case 'MANAGER_APPROVED': return 'text-blue-600 bg-blue-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
}
