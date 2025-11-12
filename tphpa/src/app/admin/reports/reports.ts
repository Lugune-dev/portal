import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReportService, Report } from '../../services/report.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponent implements OnInit {
  reports: any[] = [];
  selectedReport: any | null = null;

  sidebarItems: any[] = [
    { icon: 'fas fa-tachometer-alt', label: 'Dashboard', active: false, route: '/admin/dashboard' },
    { icon: 'fas fa-bullhorn', label: 'Advertisements', active: false, route: '/admin/advertisements' },
    { icon: 'fas fa-users', label: 'User List', active: false, route: '/admin/user-list' },
    { icon: 'fas fa-user-plus', label: 'Register User', active: false, route: '/admin/user-registration' },
    { icon: 'fas fa-chart-bar', label: 'Reports', active: true, route: '/admin/reports' },
    { icon: 'fas fa-cog', label: 'Settings', active: false, route: '/admin/settings' }
  ];

  constructor(private router: Router, private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.reportService.getAllReports().subscribe({
      next: (reports) => {
        this.reports = reports.map(report => ({
          id: report.id,
          title: `Report #${report.id}`,
          description: report.comments || 'No description available',
          type: report.type || 'GENERAL',
          submitter: report.submitter_name || 'Unknown',
          submittedDate: report.submitted_date,
          status: report.status
        }));
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        // Fallback to empty array if API fails
        this.reports = [];
      }
    });
  }

  viewReport(report: any): void {
    this.selectedReport = report;
  }

  closeModal(): void {
    this.selectedReport = null;
  }

  downloadAttachment(report: any): void {
    // Attachments not implemented in current backend
    console.log('Download attachment not available for report:', report.id);
  }

  deleteReport(report: any): void {
    if (confirm('Are you sure you want to delete this report?')) {
      this.reportService.deleteReport(report.id).subscribe({
        next: () => {
          this.loadReports();
        },
        error: (error) => {
          console.error('Error deleting report:', error);
        }
      });
    }
  }

  setActiveSidebar(item: any): void {
    this.sidebarItems.forEach(i => i.active = false);
    item.active = true;
  }

  logout(): void {
    // Implement logout logic
    this.router.navigate(['/login']);
  }
}
