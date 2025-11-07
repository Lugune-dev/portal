// src/app/routes.ts

import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home').then(m => m.Home) },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },
  { path: 'forms/:formType', loadComponent: () => import('./dynamic-forms/dynamic-forms').then(m => m.DynamicFormComponent) },
  { path: 'employee/dashboard', loadComponent: () => import('./employee/employee-dashboard/employee-dashboard').then(m => m.EmployeeDashboard), canActivate: [() => import('./guards/employee-guard-guard').then(m => m.employeeGuardGuard)] },
  { path: 'admin/dashboard', loadComponent: () => import('./admin/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent), canActivate: [() => import('./guards/admin-guard').then(m => m.adminGuard)] },
  { path: 'director/dashboard', loadComponent: () => import('./director/director-dashboard/director-dashboard').then(m => m.DirectorDashboardComponent), canActivate: [() => import('./guards/admin-guard').then(m => m.adminGuard)] },

  { path: 'director-general/dashboard', loadComponent: () => import('./director/director-general-dashboard/director-general-dashboard').then(m => m.DirectorGeneralDashboardComponent), canActivate: [() => import('./guards/dg-guard').then(m => m.dgGuard)] },
  { path: 'admin/advertisements', loadComponent: () => import('./admin/advertisements/advertisements').then(m => m.AdvertisementsComponent) },
  { path: 'admin/user-registration', loadComponent: () => import('./admin/user-registration/user-registration').then(m => m.UserRegistrationComponent), canActivate: [() => import('./guards/admin-guard').then(m => m.adminGuard)] },
  { path: 'admin/user-list', loadComponent: () => import('./admin/user-list/user-list').then(m => m.UserListComponent), canActivate: [() => import('./guards/admin-guard').then(m => m.adminGuard)] },
  { path: 'admin/reports', loadComponent: () => import('./admin/reports/reports').then(m => m.ReportsComponent), canActivate: [() => import('./guards/admin-guard').then(m => m.adminGuard)] },
  { path: 'admin/settings', loadComponent: () => import('./admin/settings/settings').then(m => m.SettingsComponent), canActivate: [() => import('./guards/admin-guard').then(m => m.adminGuard)] },
  { path: 'advertisements', loadComponent: () => import('./advertisements/advertisements').then(m => m.Advertisements) },
  { path: 'fa-manager/fa-manger-dashboard', loadComponent: () => import('./fa-manager/fa-manager-dashboard/fa-manager-dashboard').then(m => m.FaManagerDashboardComponent) },
  { path: 'manager/dashboard', loadComponent: () => import('./manager/dashboard/dashboard').then(m => m.DashboardComponent), canActivate: [() => import('./guards/unit-manager-guard').then(m => m.unitManagerGuard)] },
  { path: 'publications', loadComponent: () => import('./publications/publications').then(m => m.PublicationsComponent) },
  { path: 'resources', loadComponent: () => import('./resources/resources').then(m => m.ResourcesComponent) },
  { path: 'submit', loadComponent: () => import('./dynamic-forms/dynamic-forms').then(m => m.DynamicFormComponent) },
  { path: 'careers', loadComponent: () => import('./careers/careers').then(m => m.CareersComponent) },
  { path: 'about', loadComponent: () => import('./about/about').then(m => m.AboutComponent) },
  { path: 'contact', loadComponent: () => import('./contact/contact').then(m => m.ContactComponent) }
]
