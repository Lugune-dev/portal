import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Announcement {
  id?: number;
  title: string;
  summary: string;
  content?: string;
  category: string;
  date_published: string;
  is_urgent: boolean;
  image_url?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private apiUrl = 'https://portal-api-z927.onrender.com/api';

  constructor(private http: HttpClient){}
  
  getAnnouncement(): Observable<any[]>{
    return this.http.get<any []>(`${this.apiUrl}/announcement`);
  }
  
  createAnnouncement(data: Announcement, imageFile?: File): Observable<any> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('summary', data.summary);
    if (data.content) {
      formData.append('content', data.content);
    }
    formData.append('category', data.category);
    formData.append('date_published', data.date_published);
    formData.append('is_urgent', data.is_urgent ? '1' : '0');
    
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    return this.http.post<any>(`${this.apiUrl}/announcement`, formData);
  }
  
  updateAnnouncement(id: number, data: Announcement, imageFile?: File): Observable<any> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('summary', data.summary);
    if (data.content) {
      formData.append('content', data.content);
    }
    formData.append('category', data.category);
    formData.append('date_published', data.date_published);
    formData.append('is_urgent', data.is_urgent ? '1' : '0');
    
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    return this.http.put<any>(`${this.apiUrl}/announcement/${id}`, formData);
  }
  
  deleteAnnouncement(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/announcement/${id}`);
  }
}
