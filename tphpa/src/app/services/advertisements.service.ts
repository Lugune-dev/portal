// src/app/services/advertisement.service.ts - CORRECTED

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Advertisement } from './advertisement.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdvertisementService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) { }

  /**
   * Sends a POST request using FormData, including the image file.
   * @param adData The advertisement data (title, description, etc.).
   * @param imageFile The actual File object to upload.
   */
  createAdvertisement(adData: Advertisement, imageFile: File): Observable<any> {
    const formData = new FormData();

    // 1. Append the file with the key 'image', matching upload.single('image')
    formData.append('image', imageFile, imageFile.name);

    // 2. Append all other form fields
    formData.append('title', adData.title);
    formData.append('description', adData.description || '');
    formData.append('linkUrl', adData.linkUrl || '');
    formData.append('startDate', adData.startDate || '');
    formData.append('endDate', adData.endDate || '');
    
    // 🔑 CRITICAL FIX: Convert the boolean to the string '1' or '0' for MySQL.
    // This prevents the "Incorrect integer value: 'true'" error.
    const isActiveValue = adData.isActive ? '1' : '0';
    formData.append('isActive', isActiveValue); 

    // Use the correct endpoint and send the FormData object
    return this.http.post<any>(`${this.baseUrl}/advertisements`, formData);
  }

  getAllAdvertisements(): Observable<Advertisement[]> {
    return this.http.get<Advertisement[]>(`${this.baseUrl}/advertisements`);
  }

  updateAdvertisement(id: number, adData: Advertisement, imageFile?: File): Observable<any> {
    const formData = new FormData();

    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }

    formData.append('title', adData.title);
    formData.append('description', adData.description || '');
    formData.append('linkUrl', adData.linkUrl || '');
    formData.append('startDate', adData.startDate || '');
    formData.append('endDate', adData.endDate || '');
    const isActiveValue = adData.isActive ? '1' : '0';
    formData.append('isActive', isActiveValue);

    return this.http.put<any>(`${this.baseUrl}/advertisements/${id}`, formData);
  }

  deleteAdvertisement(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/advertisements/${id}`);
  }
}
