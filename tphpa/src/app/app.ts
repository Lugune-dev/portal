import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './layout/header/header';
import { Footer } from './layout/footer/footer'; // Corrected import name

@Component({
  selector: 'app-root',
  standalone: true, // You also need this line if you are using standalone components
  imports: [RouterOutlet, CommonModule, HeaderComponent, Footer], // Corrected the name in the array
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('portal');

  constructor(private router: Router) {}

  isDashboardRoute(): boolean {
    const currentUrl = this.router.url;
    return currentUrl.includes('/dashboard') || currentUrl.includes('/admin/') || currentUrl.includes('/employee/dashboard') || currentUrl.includes('/director/dashboard') || currentUrl.includes('/fa-manager/');
  }
}
