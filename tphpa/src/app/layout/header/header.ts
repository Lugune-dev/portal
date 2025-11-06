import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMenuOpen: boolean = false;
  isAuthenticated: boolean = false;
  private authSubscription: Subscription = new Subscription();

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
  }

  getUserInitials(): string {
    const name = this.userName;
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
