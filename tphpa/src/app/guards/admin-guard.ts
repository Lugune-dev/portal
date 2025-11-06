// src/app/guards/admin-guard.ts (DEBUG VERSION)

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();
  const rawRole = authService.getRole(); // Get the role directly from localStorage
  const userRole = rawRole?.toLowerCase() ?? '';
  
  // 🔑 CRITICAL DEBUG LOGS: CHECK YOUR BROWSER CONSOLE FOR THESE!
  console.log('----------------------------------------------------');
  console.log(`GUARD CHECK FOR: ${state.url}`);
  console.log(`1. isAuthenticated: ${isAuthenticated}`);
  console.log(`2. Raw Role from localStorage: "${rawRole}"`);
  console.log(`3. Final Check Role: "${userRole}"`);
  console.log('----------------------------------------------------');


  if (isAuthenticated && userRole === 'admin') {
    console.log('✅ ADMIN GUARD: ACCESS GRANTED');
    return true; 
  } else {
    console.log('❌ ADMIN GUARD: ACCESS DENIED. Redirecting to /login');
    router.navigate(['/login']);
    return false;
  }
};