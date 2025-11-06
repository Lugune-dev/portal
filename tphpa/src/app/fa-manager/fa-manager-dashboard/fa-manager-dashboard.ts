import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HierarchyService } from '../../services/hierarchy/hierarchy.service';
import { FormService, FormInstance } from '../../services/form/form';
import { AuthService } from '../../services/auth/auth';

@Component({
  selector: 'app-fa-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <h1>FA Manager Dashboard</h1>
      <div class="metrics-grid">
        <div class="metric-card">
          <h3>Finance Reports</h3>
          <p>{{ financeForms.length }}</p>
        </div>
        <div class="metric-card">
          <h3>Pending Imprest/Claims</h3>
          <p>{{ pendingFinanceForms.length }}</p>
        </div>
        <div class="metric-card">
          <h3>Total Budget Allocation</h3>
          <p>{{ totalBudget }}</p>
        </div>
      </div>
      
      <div class="forms-section">
        <h3>Pending Finance Forms</h3>
        <ul>
          <li *ngFor="let form of pendingFinanceForms">
            Form ID: {{ form.form_type_id }} - {{ form.form_status }} - Amount: {{ form.total_amount }}
            <button (click)="approveForm(form.instance_id?.toString() || '')">Approve</button>
            <button (click)="rejectForm(form.instance_id?.toString() || '')">Reject</button>
            <button (click)="escalateToDG(form.instance_id?.toString() || '')">Escalate to DG</button>
          </li>
        </ul>
      </div>
      
      <div class="budget-section">
        <h3>Budget Overview</h3>
        <p>Current allocation and usage summary for FA.</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .metric-card { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric-card h3 { margin: 0 0 10px 0; color: #333; }
    .metric-card p { font-size: 24px; font-weight: bold; color: #007bff; margin: 0; }
    .forms-section, .budget-section { margin-top: 30px; }
    .forms-section h3, .budget-section h3 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
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
export class FaManagerDashboardComponent implements OnInit {
  financeForms: FormInstance[] = [];
  pendingFinanceForms: FormInstance[] = [];
  totalBudget: number = 0;
  userId: string = '';

  constructor(
    private hierarchyService: HierarchyService,
    private formService: FormService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getToken() || '';
    this.loadFinanceData();
  }

  loadFinanceData(): void {
    // Filter for finance-related forms (imprest, claims, etc.)
    this.formService.getFormsByReportingLine('fa_manager', this.userId).subscribe({
      next: (forms) => {
        this.financeForms = forms.filter(f => f.form_type_id > 0); // Assume all forms are finance-related for FA manager
        this.pendingFinanceForms = this.financeForms.filter(f => f.form_status === 'pending');
        this.totalBudget = this.financeForms.reduce((sum, f) => sum + (f.total_amount || 0), 0);
      },
      error: (err) => console.error('Error loading finance data:', err)
    });
  }

  approveForm(formId: string): void {
    this.hierarchyService.approveForm(formId, this.userId).subscribe({
      next: () => this.loadFinanceData(),
      error: (err) => console.error('Approval error:', err)
    });
  }

  rejectForm(formId: string): void {
    // Implement reject logic
    console.log('Rejecting finance form:', formId);
    this.loadFinanceData();
  }

  escalateToDG(formId: string): void {
    // Escalate to DG
    console.log('Escalating finance form to DG:', formId);
    this.loadFinanceData();
  }
}
