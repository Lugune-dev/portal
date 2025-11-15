import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormInstance } from '../form/form'; // Assuming FormInstance type from existing FormService

export interface HierarchyReport {
  role: string;
  subordinates: string[]; // User IDs or names
  pendingForms: FormInstance[];
  metrics: { [key: string]: number }; // e.g., { pending: 5, approved: 10 }
}

@Injectable({
  providedIn: 'root'
})
export class HierarchyService {
  private apiUrl = '/api/hierarchy';

  constructor(private http: HttpClient) {}

  getSubordinates(userId: string): Observable<{ subordinates: string[] }> {
    return this.http.get<{ subordinates: string[] }>(`${this.apiUrl}/subordinates/${userId}`);
  }

  getReportsByRole(role: string): Observable<HierarchyReport> {
    return this.http.get<HierarchyReport>(`${this.apiUrl}/reports/${role}`);
  }

  getFormsByReportingLine(level: string, userId: string): Observable<FormInstance[]> {
    return this.http.get<FormInstance[]>(`${this.apiUrl}/forms/${level}/${userId}`);
  }

  approveForm(formId: string, approverId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/approve/${formId}`, { approverId });
  }

  generateReport(params: { startDate: string; endDate: string; role?: string; unit?: string }): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/reports/generate`, params, { responseType: 'blob' });
  }
}
