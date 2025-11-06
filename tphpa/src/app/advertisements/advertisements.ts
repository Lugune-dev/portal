import { Component, OnInit, Inject, PLATFORM_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { DatePipe } from '@angular/common';

// Swiper imports (adapter not available in this swiper version)
import { Navigation, Pagination, Autoplay, A11y } from 'swiper';

interface Advertisement {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

@Component({
  selector: 'app-advertisements',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule
  ],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [DatePipe],
  templateUrl: './advertisements.html',
  styleUrls: ['./advertisements.css']
})
export class Advertisements implements OnInit {
  // Swiper Configuration
  swiperConfig = {
    modules: [Navigation, Pagination, Autoplay, A11y],
    slidesPerView: 1,
    spaceBetween: 20,
    navigation: true,
    pagination: { clickable: true },
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
    loop: true,
    breakpoints: {
      640: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      768: {
        slidesPerView: 3,
        spaceBetween: 30,
      },
      1024: {
        slidesPerView: 4,
        spaceBetween: 30,
      },
    },
  };

  adsLoading = true;
  adsError = false;
  activeAds: Advertisement[] = [];

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchAdvertisements();
    }
  }

  // Advertisement Methods
  fetchAdvertisements(): void {
    this.adsLoading = true;
    this.adsError = false;

    this.http.get<{ success: boolean; data: Advertisement[] }>('/api/advertisements')
      .subscribe({
        next: (res) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          this.activeAds = res.data
            .filter(ad => ad.isActive && new Date(ad.endDate) >= today)
            .slice(0, 12); // Show more ads on dedicated page

          console.log('Active ads loaded:', this.activeAds.length);
          this.adsLoading = false;
        },
        error: (err) => {
          console.error('Failed to fetch ads:', err);
          this.adsError = true;
          this.adsLoading = false;
        }
      });
  }
}
