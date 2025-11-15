import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormService } from '../services/form/form';
import { FormConfig, FormSection, FormField } from '../services/form/form';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth/auth';
import { OrganizationService, OrganizationUnit } from '../services/organization.service';
import { ApprovalsService } from '../services/approvals.service';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dynamic-forms.html',
  styleUrls: ['./dynamic-forms.css']
})
export class DynamicFormComponent implements OnInit {
  @Input() formType: string = '';
  @Input() showBack: boolean = true;
  @Input() showSwitcher: boolean = true;
  @Output() backToList = new EventEmitter<void>();
  formStructure: FormConfig | null = null;
  formConfig: FormConfig | null = null;
  dynamicForm!: FormGroup;
  isLoading = false;
  error = '';
  connectionError = false;
  formTypeCode = '';
  organizationUnits: OrganizationUnit[] = [];
  signedFields: { [key: string]: boolean } = {};
  fieldApprovalMeta: Record<string, any> | null = null;

  constructor(
    private fb: FormBuilder,
    private formService: FormService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private organizationService: OrganizationService,
    private approvals: ApprovalsService
  ) {}

  ngOnInit(): void {
    this.loadOrganizationUnits();
    if (this.formType) {
      this.formTypeCode = this.formType;
      this.loadForm(this.formType);
    } else {
      this.route.paramMap.subscribe(params => {
        const formType = params.get('formType');
        if (formType) {
          this.formTypeCode = formType;
          this.loadForm(formType);
        } else {
          this.error = 'No form type specified.';
          this.connectionError = false;
          this.isLoading = false;
        }
      });
    }
  }

  async requestApprovalForField(fieldName: string, note?: string) {
    const formId = (this.formConfig && (this.formConfig as any).id) || this.formTypeCode || null;
    const requestorId = this.authService.getUserId() || null;

    if (!formId) {
      return;
    }

    const payload = { formId, fieldName, requestorId: requestorId ?? undefined, note };
    this.approvals.requestApproval(payload).subscribe({
      next: (resp: any) => {
        this.signedFields[fieldName] = false;
        const approvalId = resp && (resp.id || resp.insertId || resp.approvalId) ? (resp.id || resp.insertId || resp.approvalId) : null;
        (this.fieldApprovalMeta = this.fieldApprovalMeta || {})[fieldName] = { status: 'pending', created_at: resp.created_at || new Date().toISOString(), mock: !!resp.mock, approvalId };
        this.cdr.markForCheck();

        if (approvalId) {
          this.startApprovalPolling(approvalId, fieldName);
        }
      },
      error: (err: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Approval Request Failed',
          text: 'Could not send approval request. Please try again later.'
        });
      }
    });
  }

  startApprovalPolling(approvalId: number | string, fieldName: string) {
    const pollInterval = 5000;
    const key = `approval_poll_${fieldName}`;
    
    (this as any)[key] = setInterval(async () => {
      try {
        const resp: any = await this.approvals.getApprovalStatus(approvalId).toPromise();
        if (!resp || !resp.approval) return;
        const approval = resp.approval;
        
        if (approval.status && approval.status !== 'pending') {
          clearInterval((this as any)[key]);
          (this.fieldApprovalMeta = this.fieldApprovalMeta || {})[fieldName] = { ...this.fieldApprovalMeta[fieldName], status: approval.status, approved_at: approval.approved_at };
          
          if (approval.signature_payload) {
            try {
              const payload = typeof approval.signature_payload === 'string' ? JSON.parse(approval.signature_payload) : approval.signature_payload;
              this.dynamicForm.get(fieldName)?.setValue(JSON.stringify(payload));
              this.signedFields[fieldName] = true;
            } catch (e) {
              console.warn('Failed to parse signature_payload');
            }
          }
          this.cdr.markForCheck();
        }
      } catch (e) {
        console.warn('Approval polling error');
      }
    }, pollInterval);
  }

  loadForm(formType: string): void {
    this.isLoading = true;
    this.error = '';
    this.connectionError = false;
    this.formConfig = null;
    this.formStructure = null;
    
    if (this.dynamicForm) {
      this.dynamicForm.reset();
    }
    
    this.formService.getFormStructure(formType).subscribe({
      next: (data: any) => {
        this.formStructure = data;
        this.formConfig = data;
        this.createFormGroup();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.formConfig = null;
        this.formStructure = null;
        this.error = err.message || 'Failed to load form structure';
        this.connectionError = true;
        this.cdr.detectChanges();
      }
    });
  }

  createFormGroup(): void {
    const group: any = {};
    if (this.formStructure && this.formStructure.sections) {
      this.formStructure.sections.forEach((section: FormSection) => {
        section.fields.forEach((field: FormField) => {
          const validators = field.is_required ? [Validators.required] : [];
          group[field.field_name] = [field.default_value || '', validators];
        });
      });
      this.dynamicForm = this.fb.group(group);
    } else {
      this.dynamicForm = this.fb.group({});
    }
  }

  onSubmit(): void {
    const requiredFieldsFilled = this.formConfig?.sections.every(section =>
      section.fields.every(field => {
        if (field.is_required && field.field_type !== 'signature') {
          const control = this.dynamicForm.get(field.field_name);
          return control && control.valid && control.value;
        }
        return true;
      })
    );

    if (requiredFieldsFilled) {
      const userId = this.authService.getUserId();
      const formData = {
        instance_id: Math.floor(Math.random() * 1000000) + 1,
        action_type: 'submit',
        action_by: userId,
        comments: '',
        ...this.dynamicForm.value
      };

      this.formService.submitForm(formData, this.formTypeCode).subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Your application has been submitted successfully!',
            confirmButtonColor: '#198754',
            confirmButtonText: 'OK'
          }).then(() => {
            this.dynamicForm.reset();
          });
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: 'There was an error submitting your form. Please try again.',
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'OK'
          });
        }
      });
    } else {
      this.dynamicForm.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all required fields before submitting.',
        confirmButtonColor: '#ffc107',
        confirmButtonText: 'OK'
      });
    }
  }

  backToFormsList(): void {
    if (this.showBack) {
      this.backToList.emit();
    } else {
      this.router.navigate(['/']);
    }
  }

  navigateToForm(event: any): void {
    const selectedForm = event.target.value;
    if (selectedForm && selectedForm !== this.formTypeCode) {
      this.router.navigate(['/forms', selectedForm]);
    }
  }

  retryConnection(): void {
    this.loadForm(this.formTypeCode);
  }

  trackBySectionId(index: number, section: FormSection): number {
    return section.section_id;
  }

  trackByFieldId(index: number, field: FormField): number {
    return field.field_id;
  }

  loadOrganizationUnits(): void {
    this.organizationService.getOrganizationUnits().subscribe({
      next: (response) => {
        if (response.success) {
          this.organizationUnits = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading organization units:', error);
      }
    });
  }

  signField(fieldName: string): void {
    const nameLower = (fieldName || '').toLowerCase();

    if (nameLower.includes('director') || nameLower.includes('director_general')) {
      Swal.fire({
        icon: 'info',
        title: 'Approval Required',
        text: 'This field requires Director-level approval via the external approval workflow. Please request approval instead of signing here.'
      });
      return;
    }

    const userId = this.authService.getUserId();
    const userName = this.authService.getUserName() || 'Unknown User';
    const timestamp = new Date().toISOString();

    if (!userId) {
      return;
    }

    const signatureData = {
      signed_by: userId,
      signed_by_name: userName,
      signed_at: timestamp,
      signature_type: 'dashboard'
    };

    this.dynamicForm.get(fieldName)?.setValue(JSON.stringify(signatureData));
    this.dynamicForm.get(fieldName)?.markAsTouched();
    this.signedFields[fieldName] = true;
    this.cdr.detectChanges();
  }

  onSign(fieldName: string): void {
    if (typeof (this as any).signField === 'function') {
      try {
        (this as any).signField(fieldName);
      } catch (e) {
        console.error('Error signing field');
      }
    }
  }

  get canSign(): boolean {
    return typeof (this as any).signField === 'function';
  }

  getSignatureDisplayValue(fieldValue: any, fieldName?: string): string {
    if (!fieldValue) return '';

    try {
      const signatureData = typeof fieldValue === 'string' ? JSON.parse(fieldValue) : fieldValue;

      if (signatureData.signature_type === 'external') {
        const approvalType = fieldName && fieldName.includes('director_general') ? 'Workflow Confirmed' : 'Electronically Approved';
        return `${signatureData.signed_by_name} (${approvalType})`;
      } else {
        return signatureData.signed_by_name || 'Signed';
      }
    } catch (e) {
      return fieldValue;
    }
  }

  getSignatureTimestamp(fieldValue: any): string {
    if (!fieldValue) return '';

    try {
      const signatureData = typeof fieldValue === 'string' ? JSON.parse(fieldValue) : fieldValue;
      if (signatureData.signed_at) {
        return new Date(signatureData.signed_at).toLocaleString();
      }
    } catch (e) {
      return '';
    }
    return '';
  }

  getApprovalLabel(field: FormField): string {
    if (!field) return '';
    if (field.signature_type === 'external') {
      const name = (field.field_name || '').toLowerCase();
      if (name.includes('director_general')) return 'Director General Approval';
      if (name.includes('director')) return 'Director Approval';
      return (field.field_label || '').replace('Sign', 'Approval');
    }
    return field.field_label || '';
  }

  isExternalField(field: FormField): boolean {
    if (!field) return false;
    if (field.signature_type === 'external') return true;
    const name = (field.field_name || '').toLowerCase();
    if (name.includes('director_general') || name.includes('director')) return true;
    const label = (field.field_label || '').toLowerCase();
    if (label.includes('director') || label.includes('director general') || label.includes('dg')) return true;
    return false;
  }

  isExternalByName(fieldName: string): boolean {
    if (!fieldName) return false;
    const nameLower = fieldName.toLowerCase();
    
    if (this.formStructure && this.formStructure.sections) {
      for (const section of this.formStructure.sections) {
        for (const f of section.fields) {
          if ((f.field_name || '').toLowerCase() === nameLower) {
            return this.isExternalField(f as FormField);
          }
        }
      }
    }
    
    if (nameLower.includes('director') || nameLower.includes('dg') || nameLower.includes('director_general') || nameLower.includes('director-general')) return true;
    return false;
  }

  getTotalFieldCount(): number {
    if (!this.formConfig?.sections) return 0;
    return this.formConfig.sections.reduce((total, section) => total + section.fields.length, 0);
  }
}