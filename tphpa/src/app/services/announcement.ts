import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private apiUrl = 'https://portal-api-z927.onrender.com/api';

  constructor(private http: HttpClient){}
  getAnnouncement(): Observable<any>{
    return this.http.get<any []>(this.apiUrl);
  }
  
}
