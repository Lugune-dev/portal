import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';

export const headDirectorateGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();
  const rawRole = authService.getRole();
  const userRole = rawRole?.toLowerCase() ?? '';

  // Debug logs
  console.log('----------------------------------------------------');
  console.log(`HEAD DIRECTORATE GUARD CHECK FOR: ${state.url}`);
  console.log(`1. isAuthenticated: ${isAuthenticated}`);
  console.log(`2. Raw Role from localStorage: "${rawRole}"`);
  console.log(`3. Final Check Role: "${userRole}"`);
  console.log('----------------------------------------------------');

  if (isAuthenticated && userRole === 'director') {
    console.log('✅ HEAD DIRECTORATE GUARD: ACCESS GRANTED');
    return true;
  } else {
    console.log('❌ HEAD DIRECTORATE GUARD: ACCESS DENIED. Redirecting to /login');
    router.navigate(['/login']);
    return false;
  }
};
