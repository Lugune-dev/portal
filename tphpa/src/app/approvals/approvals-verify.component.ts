import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApprovalsService } from '../services/approvals.service';
import { AuthService } from '../services/auth/auth';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-approvals-verify',
  template: `
  <div class="p-8 max-w-2xl mx-auto">
    <h2 class="text-2xl font-bold mb-4">Approval Request</h2>
    <div *ngIf="loading">Loading...</div>
    <div *ngIf="error" class="text-red-600">{{error}}</div>
    <div *ngIf="request">
      <p><strong>Field:</strong> {{request.field_name}}</p>
      <p><strong>Form:</strong> {{request.form_type_code || request.instance_id}}</p>
      <p><strong>Requested at:</strong> {{request.created_at | date:'short'}}</p>
      <p><strong>Approver Email:</strong> {{request.approver_email}}</p>

      <div *ngIf="!isSigned && isAllowed" class="mt-4 flex gap-3">
        <button (click)="confirm('approved')" class="px-4 py-2 bg-green-600 text-white rounded">Approve</button>
        <button (click)="confirm('rejected')" class="px-4 py-2 bg-red-600 text-white rounded">Reject</button>
      </div>

      <div *ngIf="!isAllowed" class="mt-4 text-yellow-700">You must sign in as the approver ({{request.approver_email}}) to take action.</div>
      <div *ngIf="isSigned" class="mt-4 text-green-700">This request has been {{status}}.</div>
    </div>
  </div>
  `
})
export class ApprovalsVerifyComponent implements OnInit {
  request: any = null;
  loading = false;
  error = '';
  token: string | null = null;
  isAllowed = false;
  isSigned = false;
  status = '';

  constructor(private route: ActivatedRoute, private approvals: ApprovalsService, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');
      if (!this.token) {
        this.error = 'Missing token';
        return;
      }
      this.loadToken();
    });
  }

  loadToken() {
    this.loading = true;
    this.approvals.verifyToken(this.token as string).subscribe((resp: any) => {
      this.loading = false;
      if (!resp || !resp.success) {
        this.error = (resp && resp.error) || 'Invalid token or server error';
        return;
      }
      this.request = resp.request;
      this.status = this.request.status;
      this.isSigned = this.request.status !== 'pending';
      // Check if logged-in user's email matches approver_email
      const loggedEmail = this.auth.getUserEmail();
      this.isAllowed = this.auth.isAuthenticated() && loggedEmail && this.request.approver_email && loggedEmail.toLowerCase() === this.request.approver_email.toLowerCase();
      // If not logged in, redirect to login preserving return URL
      if (!this.auth.isAuthenticated()) {
        // Save intended return URL and redirect to login
        const returnUrl = this.router.url;
        this.router.navigate(['/login'], { queryParams: { returnUrl: returnUrl } });
      }
    }, err => {
      this.loading = false;
      this.error = 'Server error verifying token';
    });
  }

  confirm(decision: 'approved'|'rejected') {
    if (!this.token) return;
    const approverName = this.auth.getFullName() || this.auth.getUserEmail();
    this.approvals.requestApproval; // noop to ensure import
    fetch('/api/approvals/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: this.token, decision, approverName })
    }).then(r => r.json()).then((j) => {
      if (j && j.success) {
        this.isSigned = true;
        this.status = j.status || decision;
      } else {
        this.error = j && j.error ? j.error : 'Failed to confirm';
      }
    }).catch(e => { this.error = 'Network error confirming'; });
  }
}
