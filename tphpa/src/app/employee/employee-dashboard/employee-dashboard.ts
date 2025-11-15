import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

// Import actual services
import { AuthService } from '../../services/auth/auth';
import { ReportService, Report } from '../../services/report.service';
import { FormsService, FormSubmission } from '../../services/forms.service';
import { Observable, of } from 'rxjs';

// Import the actual DynamicFormComponent
import { DynamicFormComponent } from '../../dynamic-forms/dynamic-forms';
// Import the ChangePasswordComponent
import { ChangePasswordComponent } from '../../features/auth/change-password/change-password';

// Interface for Forms/Applications
export interface FormInstance {
  id: number;
  form_type_id: number;
  form_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUBMITTED';
  created_at: string;
}

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DynamicFormComponent, ChangePasswordComponent],
  templateUrl: './employee-dashboard.html',
  styleUrls: ['./employee-dashboard.css'],
})
export class EmployeeDashboard implements OnInit {
  activeView: string = 'dashboard';
  selectedFormType: string = '';
  sidebarOpen: boolean = false;
  
  availableForms: { code: string; name: string }[] = [
    { code: 'RETIREMENT_IMPREST', name: 'Retirement Imprest' },
    { code: 'SAFARI_IMPREST', name: 'Safari Imprest' },
    { code: 'SPECIAL_IMPREST', name: 'Special Imprest' },
    { code: 'CLAIM_FORM', name: 'Claim Form' },
    { code: 'OUTSTANDING_IMPREST', name: 'Outstanding Imprest' },
    { code: 'PETTY_CASH', name: 'Petty Cash' }
  ];

  myForms: FormInstance[] = [];
  reports: Report[] = [];
  reportForm!: FormGroup;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService, // Changed to public for template access
    private router: Router,
    private reportService: ReportService,
    private formsService: FormsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔄 EmployeeDashboard initialized');
    this.initializeReportForm();

    // Load data immediately if already authenticated
    if (this.authService.isAuthenticated() && this.authService.getUserId()) {
      console.log('✅ User authenticated, loading data...');
      this.loadMyForms();
      this.loadReports();
    } else {
      console.log('❌ User not authenticated');
    }

    // Subscribe to auth state changes
    this.authService.authState$.subscribe(isAuthenticated => {
      console.log('🔐 Auth state changed:', isAuthenticated);
      if (isAuthenticated && this.authService.getUserId()) {
        this.loadMyForms();
        this.loadReports();
      } else {
        this.myForms = [];
        this.reports = [];
      }
      this.cdr.detectChanges();
    });
  }

  // --- Auth & Navigation Methods ---

  get userName(): string | null {
    return this.authService.getFullName();
  }

  logout(): void {
    console.log('🚪 Logging out...');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    const name = this.userName;
    if (!name) return 'U';
    const parts = name.split(' ');
    const first = parts[0] ? parts[0][0] : '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase().slice(0, 2);
  }

  getViewTitle(): string {
    const titles: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'send-report': 'Send Report',
      'view-report': 'View Reports',
      'launch': 'Launch Application',
      'status': 'Application Status',
      'form': this.selectedFormType ? this.getFormName(this.selectedFormType) : 'Application Form'
    };
    return titles[this.activeView] || 'Dashboard';
  }

  // --- Form/Application Methods ---

  selectForm(code: string): void {
    console.log('🎯 Selecting form:', code);
    this.selectedFormType = code;
    this.activeView = 'form';
    console.log('🔄 Active view set to:', this.activeView);
    console.log('📝 Selected form type:', this.selectedFormType);
    this.cdr.detectChanges();
  }

  loadMyForms(): void {
    const userId = this.authService.getUserId();
    console.log('📋 Loading my forms for user:', userId);
    if (userId) {
      this.formsService.getUserForms(userId).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('✅ Forms loaded successfully:', response.data.length, 'forms');
            this.myForms = response.data.map(form => ({
              id: form.id,
              form_type_id: this.getFormTypeId(form.form_type_code || form.form_type_name || ''),
              form_status: this.mapActionTypeToStatus(form.action_type),
              created_at: form.created_at
            }));
          } else {
            console.error('❌ Failed to load forms:', response);
          }
        },
        error: (err) => {
          console.error('❌ Error loading user forms:', err);
        }
      });
    }
  }

  private getFormTypeId(formTypeName: string): number {
    const mappings: { [key: string]: number } = {
      'RETIREMENT_IMPREST': 1,
      'Retirement of Imprest': 1,
      'SAFARI_IMPREST': 2,
      'Safari Imprest': 2,
      'SPECIAL_IMPREST': 3,
      'Special Imprest': 3,
      'CLAIM_FORM': 4,
      'Claim Form': 4,
      'OUTSTANDING_IMPREST': 5,
      'Outstanding Imprest': 5,
      'PETTY_CASH': 6,
      'Petty Cash': 6
    };
    return mappings[formTypeName] || 0;
  }

  private mapActionTypeToStatus(actionType: string): 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUBMITTED' {
    switch (actionType) {
      case 'approve':
        return 'APPROVED';
      case 'reject':
        return 'REJECTED';
      case 'submit':
        return 'PENDING';
      default:
        return 'PENDING';
    }
  }

  getStatusCount(status: string): number {
    return this.myForms.filter(form => form.form_status === status).length;
  }

  getFormName(code: string | number): string {
    const idMappings: { [key: number]: string } = {
      1: 'RETIREMENT_IMPREST', 2: 'SAFARI_IMPREST', 3: 'SPECIAL_IMPREST',
      4: 'CLAIM_FORM', 5: 'OUTSTANDING_IMPREST', 6: 'PETTY_CASH'
    };
    
    const formCode = (typeof code === 'number') ? idMappings[code] : code;
    const form = this.availableForms.find(f => f.code === formCode);
    return form ? form.name : (typeof code === 'string' ? code : 'Unknown Form');
  }
  
  onFormBack(): void {
    console.log('🔙 Back button clicked, returning to launch view');
    this.activeView = 'launch';
    this.selectedFormType = '';
    this.cdr.detectChanges();
  }

  // --- Report Methods ---

  initializeReportForm(): void {
    this.reportForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      type: ['GENERAL', Validators.required]
    });
  }

  loadReports(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.reportService.getUserReports(userId).subscribe({
        next: (reports: Report[]) => {
          this.reports = reports;
        },
        error: (err: any) => {
          console.error('Error loading user reports:', err);
        }
      });
    }
  }

  submitReport(): void {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) {
      alert('User not authenticated. Please log in again.');
      return;
    }

    const formValue = this.reportForm.value;
    const formData = new FormData();
    formData.append('title', formValue.title);
    formData.append('description', formValue.description);
    formData.append('type', formValue.type);
    formData.append('userId', userId.toString());

    if (this.selectedFile) {
      formData.append('attachment', this.selectedFile, this.selectedFile.name);
    }

    this.reportService.submitReport(formData).subscribe({
        next: () => {
          Swal.fire({
            title: 'Successfully',
            text: 'Report submitted Successfully',
            confirmButtonText: 'OK',
            cancelButtonColor: 'green-900'
          });
          this.loadReports();
          this.reportForm.reset();
          this.reportForm.patchValue({ type: 'GENERAL' });
          this.selectedFile = null;
          this.activeView = 'view-report';
          this.cdr.detectChanges();
        },
      error: (err) => {
        console.error('Report submission failed:', err);
        alert('Failed to submit report. Please try again.');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size exceeds 10MB limit. Please choose a smaller file.');
        event.target.value = '';
        return;
      }
      this.selectedFile = file;
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('attachment') as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  // --- Style/Utility Methods ---

  getFormDescription(code: string): string {
    const descriptions: { [key: string]: string } = {
      'RETIREMENT_IMPREST': 'Request funds for retirement-related expenses',
      'SAFARI_IMPREST': 'Request funds for official travel and safaris',
      'SPECIAL_IMPREST': 'Request funds for special circumstances',
      'CLAIM_FORM': 'Submit expense claims for reimbursement',
      'OUTSTANDING_IMPREST': 'Track and manage outstanding imprests',
      'PETTY_CASH': 'Request petty cash for small expenses'
    };
    return descriptions[code] || '';
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'APPROVED': 'approved',
      'REJECTED': 'rejected',
      'PENDING': 'pending',
      'SUBMITTED': 'submitted'
    };
    return statusClasses[status] || 'submitted';
  }

  public setActiveView(view: string): void {
    console.log('🔄 Setting active view to:', view);
    this.activeView = view;
    this.sidebarOpen = false;
    this.cdr.detectChanges();
  }
}