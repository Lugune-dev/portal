import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrganizationUnit {
  OrgUnitID: number;
  UnitName: string;
  ParentUnitID: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {

  // Allow runtime override via `window.__env.API_BASE` (set during deployment), otherwise default to API host
  private apiUrl = (window as any).__env?.API_BASE || 'https://portal-api-z927.onrender.com/api';

  constructor(private http: HttpClient) { }

  getOrganizationUnits(): Observable<{ success: boolean; data: OrganizationUnit[] }> {
    return this.http.get<{ success: boolean; data: OrganizationUnit[] }>(`${this.apiUrl}/organization-units`);
  }
}
