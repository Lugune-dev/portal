import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdvertisementService } from '../../services/advertisements.service';
import { Advertisement } from '../../services/advertisement.model';

@Component({
  selector: 'app-advertisements',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './advertisements.html',
  styleUrl: './advertisements.css'
})
export class AdvertisementsComponent implements OnInit {
  adForm!: FormGroup;
  selectedFile: File | null = null; // 👈 Add property to store the file
  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  advertisements: Advertisement[] = [];
  editingAd: Advertisement | null = null;
  showForm: boolean = false;

  sidebarItems: any[] = [
    { icon: 'fas fa-tachometer-alt', label: 'Dashboard', active: false, route: '/admin/dashboard' },
    { icon: 'fas fa-bullhorn', label: 'Advertisements', active: true, route: '/admin/advertisements' },
    { icon: 'fas fa-users', label: 'User List', active: false, route: '/admin/user-list' },
    { icon: 'fas fa-user-plus', label: 'Register User', active: false, route: '/admin/user-registration' },
    { icon: 'fas fa-chart-bar', label: 'Reports', active: false, route: '/admin/reports' },
    { icon: 'fas fa-cog', label: 'Settings', active: false, route: '/admin/settings' }
  ];

  constructor(
    private fb: FormBuilder,
    private adService: AdvertisementService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.adForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      // 💡 Remove or keep imageUrl, but its value will be ignored in the service
      linkUrl: ['', [Validators.maxLength(255)]],
      startDate: [''],
      endDate: [''],
      isActive: [true, Validators.required]
    });
    this.loadAdvertisements();
  }

  // 👈 New method to capture the file input
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  get f() { return this.adForm.controls; }

  loadAdvertisements(): void {
    this.adService.getAllAdvertisements().subscribe({
      next: (ads) => {
        this.advertisements = ads;
      },
      error: (err) => {
        console.error('Error loading advertisements', err);
        this.errorMessage = 'Failed to load advertisements.';
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  editAd(ad: Advertisement): void {
    this.editingAd = ad;
    this.showForm = true;
    this.adForm.patchValue({
      title: ad.title,
      description: ad.description,
      linkUrl: ad.linkUrl,
      startDate: ad.startDate,
      endDate: ad.endDate,
      isActive: ad.isActive
    });
  }

  deleteAd(id: number): void {
    if (confirm('Are you sure you want to delete this advertisement?')) {
      this.adService.deleteAdvertisement(id).subscribe({
        next: () => {
          this.successMessage = 'Advertisement deleted successfully!';
          this.loadAdvertisements();
        },
        error: (err) => {
          console.error('Error deleting advertisement', err);
          this.errorMessage = 'Failed to delete advertisement.';
        }
      });
    }
  }

  resetForm(): void {
    this.adForm.reset({ isActive: true });
    this.selectedFile = null;
    this.editingAd = null;
    this.successMessage = '';
    this.errorMessage = '';
  }

  setActiveSidebar(item: any): void {
    this.sidebarItems.forEach(i => i.active = false);
    item.active = true;
  }

  logout(): void {
    // Implement logout logic
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    this.successMessage = '';
    this.errorMessage = '';

    // 👈 Check for both form validation AND file selection (only for new ads)
    if (this.adForm.invalid || (!this.selectedFile && !this.editingAd)) {
      this.adForm.markAllAsTouched();
      this.errorMessage = 'Please correct the highlighted errors and select an image file.';
      return;
    }

    this.loading = true;
    const adData: Advertisement = this.adForm.value as Advertisement;

    if (this.editingAd) {
      // Update existing advertisement
      this.adService.updateAdvertisement(this.editingAd.id!, adData, this.selectedFile || undefined).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.successMessage = `Advertisement updated successfully!`;
          this.resetForm();
          this.showForm = false;
          this.loadAdvertisements();
        },
        error: (err: any) => {
          this.loading = false;
          console.error('Update error', err);
          this.errorMessage = err.error?.message || 'An unexpected error occurred during update.';
        }
      });
    } else {
      // Create new advertisement
      this.adService.createAdvertisement(adData, this.selectedFile!).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.successMessage = `Advertisement uploaded successfully!`;
          this.resetForm();
          this.loadAdvertisements();
        },
        error: (err: any) => {
          this.loading = false;
          console.error('Upload error', err);
          this.errorMessage = err.error?.message || 'An unexpected error occurred during upload.';
        }
      });
    }
  }
}
