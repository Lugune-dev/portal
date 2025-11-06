import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HierarchyService } from '../../services/hierarchy/hierarchy.service';
import { FormService, FormInstance } from '../../services/form/form';
import { AuthService } from '../../services/auth/auth';

@Component({
  selector: 'app-head-directorate-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <h1>Head of Directorate Dashboard</h1>
      <div class="metrics-grid">
        <div class="metric-card">
          <h3>Unit Managers</h3>
          <p>{{ unitManagers.length }}</p>
        </div>
        <div class="metric-card">
          <h3>Pending Unit Forms</h3>
          <p>{{ pendingForms.length }}</p>
        </div>
        <div class="metric-card">
          <h3>Aggregated Metrics</h3>
          <p>{{ metrics.totalPending || 0 }}</p>
        </div>
      </div>
      
      <div class="forms-section">
        <h3>Pending Forms from Units</h3>
        <ul>
          <li *ngFor="let form of pendingForms">
            {{ form.form_status }} - Unit: {{ form.employee_id }} - Amount: {{ form.total_amount }}
            <button (click)="approveForm(form.instance_id?.toString() || '')">Approve</button>
            <button (click)="rejectForm(form.instance_id?.toString() || '')">Reject</button>
            <button (click)="escalateToDG(form.instance_id?.toString() || '')">Escalate to DG</button>
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .metric-card { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric-card h3 { margin: 0 0 10px 0; color: #333; }
    .metric-card p { font-size: 24px; font-weight: bold; color: #007bff; margin: 0; }
    .forms-section { margin-top: 30px; }
    .forms-section h3 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    .forms-section ul { list-style: none; padding: 0; }
    .forms-section li { padding: 10px; background: #f8f9fa; margin: 5px 0; border-radius: 4px; border-left: 4px solid #007bff; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
    button { background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-left: 5px; margin-bottom: 5px; }
    button.reject { background: #dc3545; }
    button.reject:hover { background: #c82333; }
    button.escalate { background: #ffc107; color: #000; }
    button.escalate:hover { background: #e0a800; }
    button:hover { background: #218838; }
  `]
})
export class HeadDirectorateDashboardComponent implements OnInit {
  unitManagers: string[] = [];
  pendingForms: FormInstance[] = [];
  metrics: any = {};
  userId: string = '';

  constructor(
    private hierarchyService: HierarchyService,
    private formService: FormService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getToken() || '';
    this.loadUnitData();
  }

  loadUnitData(): void {
    this.hierarchyService.getSubordinates(this.userId).subscribe({
      next: (data) => {
        this.unitManagers = data.subordinates;
        this.loadPendingForms();
      },
      error: (err) => console.error('Error loading units:', err)
    });
  }

  loadPendingForms(): void {
    this.formService.getFormsByReportingLine('head_directorate', this.userId).subscribe({
      next: (forms) => {
        this.pendingForms = forms.filter(f => f.form_status === 'pending');
        this.metrics = { totalPending: this.pendingForms.length };
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
    // Implement reject logic
    console.log('Rejecting form:', formId);
    this.loadPendingForms();
  }

  escalateToDG(formId: string): void {
    // Escalate to DG
    console.log('Escalating to DG:', formId);
    this.loadPendingForms();
  }
}
