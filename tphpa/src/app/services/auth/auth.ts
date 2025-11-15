// src/app/services/auth/auth.ts (AuthService)

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://portal-api-z927.onrender.com/';

  // Valid roles for TPHA hierarchy based on database
  private validRoles: string[] = [
    'admin',        // Director General
    'director',     // Head of Directorate
    'manager',      // Unit Manager
    'employee'      // Staff/User
  ];

  // BehaviorSubject to track authentication state
  private authState = new BehaviorSubject<boolean>(this.isAuthenticated());
  public authState$ = this.authState.asObservable();

  constructor(private http: HttpClient, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) { }

  isValidRole(role: string): boolean {
    return this.validRoles.includes(role?.trim() || '');
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}login`, { email, password }).pipe(
      tap((response: any) => {
        // Store the token and user data in local storage
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('auth_token', 'dummy');
          // Map UserRoleID to role name
          const roleMap: { [key: number]: string } = {
            1: 'admin',
            2: 'admin', // Director General now maps to admin
            3: 'director',
            4: 'manager',
            5: 'employee',
            6: 'employee'
          };
          const roleName = roleMap[response.user?.UserRoleID] || 'employee';
          localStorage.setItem('user_role', roleName);
          localStorage.setItem('user_id', response.user?.UserID?.toString());
          const fullName = `${response.user?.FirstName || ''} ${response.user?.LastName || ''}`.trim();
          localStorage.setItem('user_name', fullName || response.user?.Email);
          // Store user email explicitly for matching approver identity
          if (response.user && response.user.Email) {
            localStorage.setItem('user_email', response.user.Email);
          }
          localStorage.setItem('first_name', response.user?.FirstName || '');
          localStorage.setItem('last_name', response.user?.LastName || '');
          localStorage.setItem('org_unit_id', response.user?.OrgUnitID?.toString());
        }
        // Update authentication state
        this.authState.next(true);
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_name');
      localStorage.removeItem('first_name');
      localStorage.removeItem('last_name');
    }
    // Update authentication state
    this.authState.next(false);
    this.router.navigate(['/']);
  }


  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    const token = this.getToken();
    return !!token;
  }


  getUserName(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('user_name');
  }

  getFirstName(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('first_name');
  }

  getLastName(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('last_name');
  }

  getFullName(): string | null {
    const firstName = this.getFirstName();
    const lastName = this.getLastName();
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    // If names not available, try to parse from email
    const userName = this.getUserName();
    if (userName && userName.includes('@')) {
      const localPart = userName.split('@')[0];
      const parts = localPart.split('.');
      if (parts.length >= 2) {
        const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        const last = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
        return `${first} ${last}`;
      }
    }
    return userName; // fallback to email if parsing fails
  }

  getUserEmail(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('user_email');
  }

  // Existing methods
  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('auth_token');
  }

  getRole(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const role = localStorage.getItem('user_role');

    // 🔑 THE FIX: Trim whitespace from the role before returning it.
    // This resolves issues where a hidden space (e.g., 'admin ') breaks the guard's check.
    return role ? role.trim() : null;
  }

  getUserId(): number | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const id = localStorage.getItem('user_id');
    return id ? parseInt(id, 10) : null;
  }

  getOrgUnitId(): number | null {
    // Assuming org_unit_id is stored in localStorage or derived from user_id
    // For now, return a default or fetch from backend if needed
    // This might need adjustment based on backend response
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const unitId = localStorage.getItem('org_unit_id');
    return unitId ? parseInt(unitId, 10) : null; // Default to null, adjust as needed
  }

  getUserRoleName(): string | null {
    return this.getRole(); // Assuming role name is the same as role
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}forgot-password`, { email });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}change-password`, { currentPassword, newPassword });
  }
}
