import { CanActivateFn } from '@angular/router';

export const employeeGuardGuard: CanActivateFn = (route, state) => {
  return true;
};
