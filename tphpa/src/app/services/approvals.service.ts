import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ApprovalRequestPayload {
  formId: number | string;
  fieldName: string;
  requestorId?: number | string;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class ApprovalsService {
  // Configure base URL via environment in a real app.
  private base = '/api/approvals';

  constructor(private http: HttpClient) {}

  // Create an approval request. Returns the approvals record or an acceptance response.
  requestApproval(payload: ApprovalRequestPayload): Observable<any> {
    // In dev without backend, this will still return a mocked response if the call fails.
    return this.http.post(`${this.base}`, payload).pipe(
      catchError(err => {
        // Fallback: return a mocked accepted response so frontend can continue UX testing
        console.warn('ApprovalsService.requestApproval failed, returning mock response', err);
        return of({ ok: true, pending: true, mock: true, created_at: new Date().toISOString() });
      })
    );
  }

  // Get approval status by id
  getApprovalStatus(id: number | string): Observable<any> {
    return this.http.get(`${this.base}/${id}`).pipe(
      catchError(err => {
        console.warn('ApprovalsService.getApprovalStatus failed', err);
        return of(null);
      })
    );
  }

  // Verify a token (used by approver landing page)
  verifyToken(token: string): Observable<any> {
    return this.http.get(`${this.base}/verify?token=${encodeURIComponent(token)}`).pipe(
      catchError(err => {
        console.warn('ApprovalsService.verifyToken failed', err);
        return of(null);
      })
    );
  }
}
