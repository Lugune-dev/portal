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
    private organizationService: OrganizationService
    , private approvals: ApprovalsService
  ) {}

  ngOnInit(): void {
    this.loadOrganizationUnits();
    if (this.formType) {
      this.formTypeCode = this.formType;
      this.loadForm(this.formType);
    } else {
      this.route.paramMap.subscribe(params => {
        const formType = params.get('formType');
        console.log('Route param formType:', formType);
        if (formType) {
          this.formTypeCode = formType;
          this.loadForm(formType);
        } else {
          console.error('No form type found in route parameters.');
          this.error = 'No form type specified.';
          this.connectionError = false;
          this.isLoading = false;
        }
      });
    }
  }

  async requestApprovalForField(fieldName: string, note?: string) {
    // Determine an identifier for the form: prefer an explicit form id from formConfig if available,
    // otherwise fall back to the form type code so backend can at least correlate the request.
    const formId = (this.formConfig && (this.formConfig as any).id) || this.formTypeCode || null;
    const requestorId = this.authService.getUserId() || null;

    if (!formId) {
      console.error('requestApprovalForField: no form id or formTypeCode available');
      return;
    }

  const payload = { formId, fieldName, requestorId: requestorId ?? undefined, note };
    this.approvals.requestApproval(payload).subscribe({
      next: (resp: any) => {
        console.log('Approval request response', resp);
        // show a simple in-UI state: mark field as pending
        this.signedFields[fieldName] = false; // still unsigned but pending
        // Optionally attach approval metadata for display and store approval id for polling
        const approvalId = resp && (resp.id || resp.insertId || resp.approvalId) ? (resp.id || resp.insertId || resp.approvalId) : null;
        (this.fieldApprovalMeta = this.fieldApprovalMeta || {})[fieldName] = { status: 'pending', created_at: resp.created_at || new Date().toISOString(), mock: !!resp.mock, approvalId };
        this.cdr.markForCheck();

        // Start polling for the approval status if we received an approval id
        if (approvalId) {
          this.startApprovalPolling(approvalId, fieldName);
        }
      },
      error: (err: any) => {
        console.error('requestApprovalForField error', err);
        Swal.fire({
          icon: 'error',
          title: 'Approval Request Failed',
          text: 'Could not send approval request. Please try again later.'
        });
      }
    });
  }

  // Poll an approval status and update field when it changes
  startApprovalPolling(approvalId: number | string, fieldName: string) {
    const pollInterval = 5000; // ms
    const key = `approval_poll_${fieldName}`;
    // Store interval id so we can clear it later
    (this as any)[key] = setInterval(async () => {
      try {
        const resp: any = await this.approvals.getApprovalStatus(approvalId).toPromise();
        if (!resp || !resp.approval) return;
        const approval = resp.approval;
        // If status changed from pending, clear poll and update UI
        if (approval.status && approval.status !== 'pending') {
          clearInterval((this as any)[key]);
          (this.fieldApprovalMeta = this.fieldApprovalMeta || {})[fieldName] = { ...this.fieldApprovalMeta[fieldName], status: approval.status, approved_at: approval.approved_at };
          // If signature_payload exists, apply it to the form control
          if (approval.signature_payload) {
            try {
              const payload = typeof approval.signature_payload === 'string' ? JSON.parse(approval.signature_payload) : approval.signature_payload;
              this.dynamicForm.get(fieldName)?.setValue(JSON.stringify(payload));
              this.signedFields[fieldName] = true;
            } catch (e) {
              console.warn('Failed to parse signature_payload', e);
            }
          }
          this.cdr.markForCheck();
        }
      } catch (e) {
        console.warn('Approval polling error for', approvalId, e);
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
    console.log('Loading form structure for:', formType);
    this.formService.getFormStructure(formType).subscribe({
      next: (data: any) => {
        console.log('Form structure received:', data);
        this.formStructure = data;
        this.formConfig = data;
        this.createFormGroup();
        console.log('Form config loaded:', this.formConfig);
        if (this.formConfig && this.formConfig.sections) {
          console.log('Sections:', this.formConfig.sections);
          this.formConfig.sections.forEach(section => {
            console.log('Section:', section.section_name);
            section.fields.forEach(field => {
              console.log('Field:', field.field_name, 'type:', field.field_type, 'signature_type:', field.signature_type);
            });
          });
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.formConfig = null;
        this.formStructure = null;
        this.error = err.message || 'Failed to load form structure';
        this.connectionError = true;
        console.error('Failed to load form structure:', err);
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
      console.log('Form group created:', this.dynamicForm);
    } else {
      console.error('Form structure is not valid. Cannot create form group.');
      this.dynamicForm = this.fb.group({});
    }
  }

  onSubmit(): void {
    // Check if all required fields are filled, but allow submission even if dashboard signatures are missing
    const requiredFieldsFilled = this.formConfig?.sections.every(section =>
      section.fields.every(field => {
        if (field.is_required && field.field_type !== 'signature') {
          const control = this.dynamicForm.get(field.field_name);
          return control && control.valid && control.value;
        }
        return true; // Non-required fields or signature fields are okay
      })
    );

    if (requiredFieldsFilled) {
      console.log('Form Submitted!', this.dynamicForm.value);

      // Prepare form data for submission
      const userId = this.authService.getUserId();
      const formData = {
        instance_id: Math.floor(Math.random() * 1000000) + 1, // Generate a smaller unique instance ID within INT range
        action_type: 'submit',
        action_by: userId, // Use actual user ID from auth service
        comments: '',
        ...this.dynamicForm.value
      };

      console.log('Submitting form data:', formData);

      // Call the form service to submit
      this.formService.submitForm(formData, this.formTypeCode).subscribe({
        next: (response) => {
          console.log('Form submission successful:', response);
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Your application has been submitted successfully!',
            confirmButtonColor: '#198754',
            confirmButtonText: 'OK'
          }).then(() => {
            // Reset the form after successful submission
            this.dynamicForm.reset();
          });
        },
        error: (error) => {
          console.error('Form submission failed:', error);
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
      console.log('Form is invalid. Please fill all required fields.');
      this.dynamicForm.markAllAsTouched();

      // Show validation error
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
          // Load all organization units for department and section selection
          this.organizationUnits = response.data;
          console.log('Organization units loaded:', this.organizationUnits);
        } else {
          console.error('Failed to load organization units');
        }
      },
      error: (error) => {
        console.error('Error loading organization units:', error);
      }
    });
  }

  signField(fieldName: string): void {
    console.log('Sign button clicked for field:', fieldName);
    const nameLower = (fieldName || '').toLowerCase();

    // Prevent signing of director-level fields from the dashboard UI
    if (nameLower.includes('director') || nameLower.includes('director_general')) {
      console.warn('Attempted to sign director-level field from dashboard:', fieldName);
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

    console.log('User ID:', userId);
    console.log('User Name:', userName);
    console.log('Timestamp:', timestamp);

    if (!userId) {
      console.error('No user ID found. Cannot sign field.');
      return;
    }

    // Update the form control with signature data
    const signatureData = {
      signed_by: userId,
      signed_by_name: userName,
      signed_at: timestamp,
      signature_type: 'dashboard'
    };

    console.log('Signature data:', signatureData);

    this.dynamicForm.get(fieldName)?.setValue(JSON.stringify(signatureData));
    this.dynamicForm.get(fieldName)?.markAsTouched();

    // Mark the field as signed for UI updates
    this.signedFields[fieldName] = true;

    console.log('Form control value after signing:', this.dynamicForm.get(fieldName)?.value);
    console.log('Signed fields:', this.signedFields);

    // Trigger change detection to update the view
    this.cdr.detectChanges();
  }

  // Wrapper to safely invoke signing from template in case of runtime binding issues
  onSign(fieldName: string): void {
    if (typeof (this as any).signField === 'function') {
      try {
        (this as any).signField(fieldName);
      } catch (e) {
        console.error('onSign: signField threw an error', e);
      }
    } else {
      console.error('onSign: signField is not a function', (this as any).signField);
    }
  }

  // Runtime guard used by template to disable Sign button when signField isn't available
  get canSign(): boolean {
    return typeof (this as any).signField === 'function';
  }

  getSignatureDisplayValue(fieldValue: any, fieldName?: string): string {
    if (!fieldValue) return '';

    try {
      const signatureData = typeof fieldValue === 'string' ? JSON.parse(fieldValue) : fieldValue;

      if (signatureData.signature_type === 'external') {
        // External approval (Director/DG) - show audit trail with different approval types
        const approvalType = fieldName && fieldName.includes('director_general') ? 'Workflow Confirmed' : 'Electronically Approved';
        return `${signatureData.signed_by_name} (${approvalType})`;
      } else {
        // Dashboard signature (Head of Project/Section)
        return signatureData.signed_by_name || 'Signed';
      }
    } catch (e) {
      return fieldValue; // Fallback for old format
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

  debugField(field: any): void {
    console.log('Field:', field.field_name, 'type:', field.field_type, 'signature_type:', field.signature_type, 'value:', this.dynamicForm.get(field.field_name)?.value);
  }

  // Return a friendly label for external approval fields (Director / Director General)
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

  // Determine whether a field should be treated as an external approval (Director-level)
  isExternalField(field: FormField): boolean {
    if (!field) return false;
    if (field.signature_type === 'external') return true;
    const name = (field.field_name || '').toLowerCase();
    // Treat director and director_general named fields as external even if metadata is missing
    if (name.includes('director_general') || name.includes('director')) return true;
    // Also consider label (some form exports put role in the label instead of the field_name)
    const label = (field.field_label || '').toLowerCase();
    if (label.includes('director') || label.includes('director general') || label.includes('dg')) return true;
    return false;
  }

  // Determine external status by field name lookup (safe if called from sign handler)
  isExternalByName(fieldName: string): boolean {
    if (!fieldName) return false;
    const nameLower = fieldName.toLowerCase();
    // Try to find the field definition in the loaded form structure
    if (this.formStructure && this.formStructure.sections) {
      for (const section of this.formStructure.sections) {
        for (const f of section.fields) {
          if ((f.field_name || '').toLowerCase() === nameLower) {
            return this.isExternalField(f as FormField);
          }
        }
      }
    }
    // Fallback heuristic
    if (nameLower.includes('director') || nameLower.includes('dg') || nameLower.includes('director_general') || nameLower.includes('director-general')) return true;
    return false;
  }
  // Add this method to your DynamicFormComponent
getTotalFieldCount(): number {
  if (!this.formConfig?.sections) return 0;
  return this.formConfig.sections.reduce((total, section) => total + section.fields.length, 0);
}
}
