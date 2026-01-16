import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NewsItem {
  id: number;
  title: string;
  category: string;
  date: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class NewsService {
  private apiUrl = 'https://portal-api-z927.onrender.com/api/announcement';

  constructor(private http: HttpClient) {}

  getPublicNews(): Observable<NewsItem[]> {
    return this.http.get<NewsItem[]>(`${this.apiUrl}/public`);
  }
}