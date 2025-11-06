import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface Report {
  id: number;
  title: string;
  description: string;
  type: string;
  submitter: string;
  submittedDate: string;
  status: string;
  attachment?: {
    name: string;
    size: number;
    url: string;
  };
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponent implements OnInit {
  reports: Report[] = [];
  selectedReport: Report | null = null;

  sidebarItems: any[] = [
    { icon: 'fas fa-tachometer-alt', label: 'Dashboard', active: false, route: '/admin/dashboard' },
    { icon: 'fas fa-bullhorn', label: 'Advertisements', active: false, route: '/admin/advertisements' },
    { icon: 'fas fa-users', label: 'User List', active: false, route: '/admin/user-registration' },
    { icon: 'fas fa-chart-bar', label: 'Reports', active: true, route: '/admin/reports' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    // Mock reports data - in real app, this would come from a service
    this.reports = [
      {
        id: 1,
        title: 'Monthly Progress Report',
        description: 'Summary of activities for October 2023',
        type: 'PROGRESS',
        submitter: 'John Doe',
        submittedDate: '2023-11-01',
        status: 'SUBMITTED',
        attachment: {
          name: 'progress_report_oct.pdf',
          size: 2.5 * 1024 * 1024, // 2.5MB
          url: '/api/reports/1/attachment'
        }
      },
      {
        id: 2,
        title: 'Expense Report',
        description: 'Travel expenses for conference',
        type: 'EXPENSE',
        submitter: 'Jane Smith',
        submittedDate: '2023-10-15',
        status: 'APPROVED'
      },
      {
        id: 3,
        title: 'Incident Report',
        description: 'System outage incident details',
        type: 'INCIDENT',
        submitter: 'Bob Johnson',
        submittedDate: '2023-10-20',
        status: 'REVIEWED',
        attachment: {
          name: 'incident_log.docx',
          size: 1.8 * 1024 * 1024, // 1.8MB
          url: '/api/reports/3/attachment'
        }
      }
    ];
  }

  viewReport(report: Report): void {
    this.selectedReport = report;
  }

  closeModal(): void {
    this.selectedReport = null;
  }

  downloadAttachment(report: Report): void {
    if (report.attachment) {
      // In a real app, this would trigger a download from the server
      console.log('Downloading attachment:', report.attachment.url);
      // For demo purposes, we'll simulate a download
      const link = document.createElement('a');
      link.href = report.attachment.url;
      link.download = report.attachment.name;
      link.click();
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
