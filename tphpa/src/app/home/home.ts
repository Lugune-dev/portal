import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy, NO_ERRORS_SCHEMA, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { DatePipe } from '@angular/common';
import { LanguageService } from '../services/language.service';
import { AuthService } from '../services/auth/auth';
import { FormsService, FormSubmission } from '../services/forms.service';

// Slick Carousel imports
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

interface Stats {
  activeFarmers: number;
  processedApplications: number;
  satisfactionRate: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    SlickCarouselModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [DatePipe],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  // Carousel Configuration
  currentSlide = 0;
  slides = [0, 1, 2, 3, 4, 5];
  private carouselInterval: any;

  // Stats Data
  stats: Stats = {
    activeFarmers: 500,
    processedApplications: 1200,
    satisfactionRate: 98
  };

  // Slick Carousel Configuration
  slickConfig = {
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    dots: true,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
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

  // Featured Advertisement
  featuredAd: Advertisement | null = null;

  adsLoading = true;
  adsError = false;
  activeAds: Advertisement[] = [];
  @ViewChild('adsCarousel') adsCarousel?: ElementRef<HTMLDivElement>;
  private adsScrollInterval: any;

  // Form Approvals for Managers
  subordinateForms: FormSubmission[] = [];
  formsLoading = false;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private datePipe: DatePipe,
    public languageService: LanguageService,
    private authService: AuthService,
    private formsService: FormsService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeCarousel();
      this.fetchAdvertisements();
      this.animateStats();
      this.loadFormApprovals();
    }
  }

  ngAfterViewInit(): void {
    // placeholder - auto-scroll starts after ads are populated
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  // Carousel Methods
  initializeCarousel(): void {
    this.showSlide(0);

    // Auto-play carousel
    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, 6000);
  }

  showSlide(index: number): void {
    this.currentSlide = index;
    const carousel = document.getElementById('carousel-slides') as HTMLElement;
    if (carousel) {
      carousel.style.transform = `translateX(-${index * 100}%)`;
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.showSlide(this.currentSlide);
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.showSlide(this.currentSlide);
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.showSlide(this.currentSlide);
  }

  // Stats Animation
  animateStats(): void {
    // Animate stats counting up
    const finalStats: Stats = {
      activeFarmers: 500,
      processedApplications: 1200,
      satisfactionRate: 98
    };

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    Object.keys(this.stats).forEach(key => {
      const finalValue = finalStats[key as keyof Stats];
      const stepValue = finalValue / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          (this.stats as any)[key] = finalValue;
          clearInterval(interval);
        } else {
          (this.stats as any)[key] = Math.round(stepValue * currentStep);
        }
      }, stepDuration);
    });
  }

  // Advertisement Methods
  fetchAdvertisements(): void {
    this.adsLoading = true;
    this.adsError = false;

    this.http.get<{ success: boolean; data: Advertisement[] }>('https://portal-api-z927.onrender.com/api/advertisements')
      .subscribe({
        next: (res) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          this.activeAds = res.data
            .filter(ad => ad.isActive && new Date(ad.endDate) >= today)
            .slice(0, 6); // Limit to 6 active ads

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

  // Form Approval Methods
  loadFormApprovals(): void {
    if (this.authService.isAuthenticated() && this.authService.getRole() === 'manager') {
      this.formsLoading = true;
      const userId = this.authService.getUserId();
      if (userId) {
        this.formsService.getSubordinateForms(userId).subscribe({
          next: (response) => {
            if (response.success) {
              this.subordinateForms = response.data;
            }
            this.formsLoading = false;
          },
          error: (err) => {
            console.error('Failed to load form approvals:', err);
            this.formsLoading = false;
          }
        });
      }
    }
  }

  // Check if user is manager
  isManager(): boolean {
    return this.authService.isAuthenticated() && this.authService.getRole() === 'manager';
  }
}
