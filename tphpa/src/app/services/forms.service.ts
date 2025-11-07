import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FormSubmission {
  id: number;
  instance_id: string;
  action_type: string;
  action_by: number;
  comments: string;
  form_data: string;
  created_at: string;
  FirstName: string;
  LastName: string;
  Email: string;
  UnitName: string;
  form_type_name?: string;
  form_type_code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FormsService {

  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  getSubordinateForms(userId: number): Observable<{ success: boolean; data: FormSubmission[] }> {
    return this.http.get<{ success: boolean; data: FormSubmission[] }>(`${this.apiUrl}/forms/subordinate-forms/${userId}`);
  }

  approveForm(formId: number, comments: string, approverId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/forms/approve/${formId}`, { approverId, comments });
  }

  rejectForm(formId: number, comments: string, rejectorId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/forms/reject/${formId}`, { rejectorId, comments });
  }

  getUserForms(userId: number): Observable<{ success: boolean; data: FormSubmission[] }> {
    return this.http.get<{ success: boolean; data: FormSubmission[] }>(`${this.apiUrl}/forms/user/${userId}`);
  }
}
