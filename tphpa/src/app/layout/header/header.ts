import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgIf, AsyncPipe } from '@angular/common';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth/auth';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NgIf, AsyncPipe, RouterModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  isMenuOpen: boolean = false;
  reportsMenuOpen: boolean = false;
  isAuthenticated: boolean = false;
  private authSubscription: Subscription = new Subscription();
  @ViewChild('subNav', { static: true }) subNav!: ElementRef;

  constructor(
    public authService: AuthService,
    public languageService: LanguageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state changes
    this.authSubscription = this.authService.authState$.subscribe(
      (isAuth) => {
        this.isAuthenticated = isAuth;
      }
    );
  }

  ngAfterViewInit(): void {
    this.adjustMobileMenuPosition();
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  get userName(): string | null {
    return this.authService.getFullName();
  }

  changeLanguage(lang: 'sw' | 'en'): void {
    this.languageService.setLanguage(lang);
  }

  logout(): void {
    this.authService.logout();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (!this.isMenuOpen) {
      this.reportsMenuOpen = false;
    }
  }

  toggleReportsMenu(): void {
    this.reportsMenuOpen = !this.reportsMenuOpen;
  }

  getUserInitials(): string {
    const name = this.userName;
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  private adjustMobileMenuPosition(): void {
    if (this.subNav) {
      const subNavHeight = this.subNav.nativeElement.offsetHeight;
      const mobileMenu = document.querySelector('.md\\:hidden.fixed.top-0.left-0.right-0.bottom-0.bg-black.bg-opacity-50.z-50') as HTMLElement;
      if (mobileMenu) {
        mobileMenu.style.top = `${subNavHeight}px`;
      }
    }
  }
}
