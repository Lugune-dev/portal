import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Announcement {
  id?: number;
  title: string;
  summary: string;
  category: string;
  date_published: string;
  is_urgent: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private apiUrl = 'https://portal-api-z927.onrender.com/api';

  constructor(private http: HttpClient){}
  
  getAnnouncement(): Observable<any>{
    return this.http.get<any []>(`${this.apiUrl}/announcement`);
  }
  
  createAnnouncement(data: Announcement): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/announcement`, data);
  }
  
  updateAnnouncement(id: number, data: Announcement): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/announcement/${id}`, data);
  }
  
  deleteAnnouncement(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/announcement/${id}`);
  }
}
