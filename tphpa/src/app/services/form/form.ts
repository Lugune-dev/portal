
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface FormConfig {
  form_type_id: number;
  form_type_name: string;
  form_type_code: string;
  sections: FormSection[];
}

export interface FormSection {
  section_id: number;
  section_name: string;
  section_order: number;
  is_repeatable: boolean;
  max_repeats?: number;
  fields: FormField[];
}

export interface FormField {
  field_id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  field_order: number;
  is_required: boolean;
  default_value?: string;
  placeholder_text?: string;
  options?: any[];
  validation_rules?: any;
  signature_type?: 'dashboard' | 'external'; // For signature fields: dashboard allows signing in form, external shows audit trail
}

export interface FormInstance {
  instance_id?: number;
  form_type_id: number;
  employee_id: number;
  form_data: any;
  form_status: string;
  total_amount?: number;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FormService {
  private apiUrl = 'https://portal-api-z927.onrender.com/api/api';

  constructor(private http: HttpClient) { }

  getFormConfig(formTypeCode: string): Observable<FormConfig> {
    if (!formTypeCode) {
      throw new Error('Form type code is required');
    }
    return this.http.get<FormConfig>(`${this.apiUrl}/forms/config/${formTypeCode}`);
  }


  saveDraft(formData: Partial<FormInstance>, formTypeCode: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forms/submit/${formTypeCode}`, { ...formData, action_type: 'save_draft' });
  }


  submitForm(formData: Partial<FormInstance>, formTypeCode: string): Observable<any> {
    // Construct the URL correctly using the formTypeCode
    const url = `${this.apiUrl}/forms/submit/${formTypeCode}`;
    console.log('Submitting form to:', url);
    return this.http.post(url, { ...formData, action_type: 'submit' });
  }

  getFormInstance(instanceId: number): Observable<FormInstance> {
    return this.http.get<FormInstance>(`${this.apiUrl}/forms/instance/${instanceId}`);
  }

  getMyForms(): Observable<FormInstance[]> {
    return this.http.get<FormInstance[]>(`${this.apiUrl}/forms/my-forms`);
  }

  getBudgetInfo(budgetItemId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/budget/${budgetItemId}`);
  }

  testConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }

  testFormsConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/forms/health`);
  }

  getFormStructure(formCode: string): Observable<any> {
    return this.getFormConfig(formCode);
  }

  getFormsByReportingLine(level: string, userId?: string): Observable<FormInstance[]> {
    const params = userId ? `/${userId}` : '';
    return this.http.get<FormInstance[]>(`${this.apiUrl}/forms/reporting-line/${level}${params}`);
  }

  getSubordinateForms(subordinateId: string): Observable<FormInstance[]> {
    return this.http.get<FormInstance[]>(`${this.apiUrl}/forms/subordinates/${subordinateId}`);
  }
}
