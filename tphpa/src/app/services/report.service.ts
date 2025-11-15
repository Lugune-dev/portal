import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface Report {
  id: number;
  title: string;
  submitter_name: string;
  submitter_unit_id: number;
  type: string;
  submitted_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT_TO_DIRECTOR';
  comments: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'https://portal-api-z927.onrender.com/api'; // Use relative path to leverage proxy

  constructor(private http: HttpClient) {}

  getManagerApprovalQueue(managerUnitId: number): Observable<Report[]> {
    // Replace with real API call
    return this.http.get<Report[]>(`${this.apiUrl}/reports/manager-queue/${managerUnitId}`);
    // For now, return mock data if API not ready
    // return of([]);
  }

  getSubordinateWorkload(managerUnitId: number): Observable<any[]> {
    // Real API call to fetch subordinate workload data from the database
    return this.http.get<any[]>(`${this.apiUrl}/reports/subordinate-workload/${managerUnitId}`);
  }

  submitReport(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/submit`, formData);
  }

  approveReport(reportId: number, comment: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/approve`, { reportId, comment });
  }

  rejectReport(reportId: number, comment: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/reject`, { reportId, comment });
  }

  getUserReports(userId: number): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/reports/user/${userId}`);
  }

  getAllReports(): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/reports/admin`);
  }

  deleteReport(reportId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reports/admin/${reportId}`);
  }

  // Director Dashboard Methods
  getDirectorQueue(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports/director-queue`);
  }

  getDirectorMetrics(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports/director-metrics`);
  }

  directorApproveReport(reportId: number, comment: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/director-approve`, { reportId, comment });
  }

  directorRejectReport(reportId: number, comment: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/director-reject`, { reportId, comment });
  }

  // Director General Dashboard Methods
  getDGCriticalItems(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports/dg-critical-items`);
  }

  getDGMetrics(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports/dg-metrics`);
  }

  dgApproveItem(itemId: number, comment: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/dg-approve`, { itemId, comment });
  }

  dgRejectItem(itemId: number, comment: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/dg-reject`, { itemId, comment });
  }
}
