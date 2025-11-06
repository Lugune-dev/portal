import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormService } from '../services/form/form';
import { FormConfig, FormSection, FormField } from '../services/form/form';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth/auth';
import { OrganizationService, OrganizationUnit } from '../services/organization.service';

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

  constructor(
    private fb: FormBuilder,
    private formService: FormService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private organizationService: OrganizationService
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
    if (this.dynamicForm.valid) {
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
          // Filter to only show departments (ParentUnitID = 100)
          this.organizationUnits = response.data.filter(unit => unit.ParentUnitID === 100);
          console.log('Organization units loaded (departments only):', this.organizationUnits);
        } else {
          console.error('Failed to load organization units');
        }
      },
      error: (error) => {
        console.error('Error loading organization units:', error);
      }
    });
  }
}
