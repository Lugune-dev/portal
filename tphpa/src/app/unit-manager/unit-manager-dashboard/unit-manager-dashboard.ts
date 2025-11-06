import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HierarchyService } from '../../services/hierarchy/hierarchy.service';
import { FormService, FormInstance } from '../../services/form/form';
import { AuthService } from '../../services/auth/auth';

@Component({
  selector: 'app-unit-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <h1>Unit Manager Dashboard</h1>
      <div class="metrics-grid">
        <div class="metric-card">
          <h3>My Subordinates</h3>
          <p>{{ subordinates.length }}</p>
        </div>
        <div class="metric-card">
          <h3>Pending Employee Forms</h3>
          <p>{{ pendingForms.length }}</p>
        </div>
        <div class="metric-card">
          <h3>Approved Forms</h3>
          <p>{{ approvedCount }}</p>
        </div>
      </div>
      
      <div class="forms-section">
        <h3>Pending Forms from Employees</h3>
        <ul>
          <li *ngFor="let form of pendingForms">
            {{ form.form_status }} - Employee: {{ form.employee_id }} - Amount: {{ form.total_amount }}
            <button (click)="approveForm(form.instance_id?.toString() || '')">Approve</button>
            <button (click)="rejectForm(form.instance_id?.toString() || '')">Reject</button>
          </li>
        </ul>
      </div>
      
      <div class="escalation-section">
        <h3>Escalate to Head of Directorate</h3>
        <button (click)="escalatePending()">Escalate All Pending</button>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .metric-card { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric-card h3 { margin: 0 0 10px 0; color: #333; }
    .metric-card p { font-size: 24px; font-weight: bold; color: #007bff; margin: 0; }
    .forms-section, .escalation-section { margin-top: 30px; }
    .forms-section h3, .escalation-section h3 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    .forms-section ul { list-style: none; padding: 0; }
    .forms-section li { padding: 10px; background: #f8f9fa; margin: 5px 0; border-radius: 4px; border-left: 4px solid #007bff; display: flex; justify-content: space-between; align-items: center; }
    button { background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-left: 10px; }
    button.reject { background: #dc3545; }
    button.reject:hover { background: #c82333; }
    button:hover { background: #218838; }
  `]
})
export class UnitManagerDashboardComponent implements OnInit {
  subordinates: string[] = [];
  pendingForms: FormInstance[] = [];
  approvedCount: number = 0;
  userId: string = '';

  constructor(
    private hierarchyService: HierarchyService,
    private formService: FormService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getToken() || '';
    this.loadSubordinateData();
  }

  loadSubordinateData(): void {
    this.hierarchyService.getSubordinates(this.userId).subscribe({
      next: (data) => {
        this.subordinates = data.subordinates;
        this.loadPendingForms();
      },
      error: (err) => console.error('Error loading subordinates:', err)
    });
  }

  loadPendingForms(): void {
    this.formService.getFormsByReportingLine('unit_manager', this.userId).subscribe({
      next: (forms) => {
        this.pendingForms = forms.filter(f => f.form_status === 'pending');
        this.approvedCount = forms.filter(f => f.form_status === 'approved').length;
      },
      error: (err) => console.error('Error loading forms:', err)
    });
  }

  approveForm(formId: string): void {
    this.hierarchyService.approveForm(formId, this.userId).subscribe({
      next: () => this.loadPendingForms(),
      error: (err) => console.error('Approval error:', err)
    });
  }

  rejectForm(formId: string): void {
    // Implement reject logic, e.g., update status to 'rejected'
    console.log('Rejecting form:', formId);
    this.loadPendingForms();
  }

  escalatePending(): void {
    // Escalate pending forms to head_directorate
    console.log('Escalating pending forms');
    this.loadPendingForms();
  }
}
