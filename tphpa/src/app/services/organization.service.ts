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

  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  getOrganizationUnits(): Observable<{ success: boolean; data: OrganizationUnit[] }> {
    return this.http.get<{ success: boolean; data: OrganizationUnit[] }>(`${this.apiUrl}/organization/units`);
  }
}
