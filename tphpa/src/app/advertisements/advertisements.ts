import { Component, OnInit, Inject, PLATFORM_ID, NO_ERRORS_SCHEMA, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { DatePipe } from '@angular/common';

// Slick Carousel integration
import { SlickCarouselModule } from 'ngx-slick-carousel';

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
    RouterModule,
    SlickCarouselModule
  ],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [DatePipe],
  templateUrl: './advertisements.html',
  styleUrls: ['./advertisements.css']
})
export class Advertisements implements OnInit, AfterViewInit, OnDestroy {
  // Slick Configuration
  slickConfig = {
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    dots: true,
    arrows: true,
    infinite: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      }
    ]
  };

  adsLoading = true;
  adsError = false;
  activeAds: Advertisement[] = [];
  // configurable time between ad slides (ms)
  public adsSlideIntervalMs = 3500;
  // debug helpers
  public showAdsDebug = true;
  public lastAdsResponse: any = null;
  public lastAdsJson = '';
  // Swiper autoplay config (referenced from template)
  public swiperAutoplay = { delay: this.adsSlideIntervalMs, disableOnInteraction: false, pauseOnMouseEnter: true };

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

  ngAfterViewInit(): void {
    // Swiper will handle autoplay/pause behaviors; nothing to attach here.
    if (isPlatformBrowser(this.platformId) && this.showAdsDebug) {
      const wrapper = document.getElementById('ads-page-wrapper');
      if (wrapper) {
        const pre = document.createElement('pre');
        pre.id = 'ads-page-debug-pre';
        pre.style.maxHeight = '220px';
        pre.style.overflow = 'auto';
        pre.style.background = 'white';
        pre.style.padding = '8px';
        pre.style.border = '1px solid #f5f5f5';
        pre.style.fontSize = '12px';
        pre.textContent = this.lastAdsJson || 'no ads response yet';
        wrapper.insertBefore(pre, wrapper.firstChild);
      }
    }
  }

  ngOnDestroy(): void {
    // No manual ad listeners to clean up when using Swiper.
  }

  // Advertisement Methods
  fetchAdvertisements(): void {
    this.adsLoading = true;
    this.adsError = false;

    this.http.get<{ success: boolean; data: Advertisement[] }>('https://portal-api-z927.onrender.com/api/advertisements')
      .subscribe({
        next: (res) => {
          // debug: inspect server payload
          console.debug('[Ads page] /api/advertisements response:', res);
          this.lastAdsResponse = res;
          try { this.lastAdsJson = JSON.stringify(res, null, 2); } catch (e) { this.lastAdsJson = String(res); }
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          console.debug('[Ads page] total ads from server:', Array.isArray(res.data) ? res.data.length : 0);

          this.activeAds = res.data
            .filter(ad => ad.isActive && new Date(ad.endDate) >= today)
            .slice(0, 12); // Show more ads on dedicated page

          // Fallback: if filter removed all items but the server returned items,
          // show unfiltered recent ads so the page isn't empty.
          if (this.activeAds.length === 0 && Array.isArray(res.data) && res.data.length > 0) {
            console.warn('[Ads page] Advertisement filter removed all items; falling back to unfiltered list for display.');
            this.activeAds = res.data.slice(0, 12);
          }

          console.debug('[Ads page] activeAds after filter:', this.activeAds);
          console.log('[Ads page] Active ads loaded:', this.activeAds.length);
          // update injected debug pre if present
          if (isPlatformBrowser(this.platformId)) {
            const pre = document.getElementById('ads-page-debug-pre');
            if (pre) { pre.textContent = this.lastAdsJson; }
          }
          this.adsLoading = false;
        },
        error: (err) => {
          console.error('[Ads page] Failed to fetch ads:', err);
          this.adsError = true;
          this.adsLoading = false;
        }
      });
  }

  startAdsAutoScroll(): void {
    // deprecated – keep for compatibility if needed, but Swiper autoplay should be used instead
  }
  stopAdsAutoScroll(): void {
    // no-op when using Swiper autoplay
  }

  
}
