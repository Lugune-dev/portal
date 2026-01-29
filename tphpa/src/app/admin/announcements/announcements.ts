import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AnnouncementService, Announcement } from '../../services/announcement';

@Component({
  selector: 'app-announcements-admin',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './announcements.html',
  styleUrls: ['./announcements.css']
})
export class AnnouncementsAdminComponent implements OnInit {
  announcements: Announcement[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  
  // Form state
  editingAnnouncement: Announcement | null = null;
  formData: Announcement = this.getEmptyForm();
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  existingImageUrl: string | null = null;
  
  sidebarItems: any[] = [
    { icon: 'fas fa-tachometer-alt', label: 'Dashboard', route: '/admin/dashboard' },
    { icon: 'fas fa-bullhorn', label: 'Announcements', route: '/admin/announcements', active: true },
    { icon: 'fas fa-ad', label: 'Advertisements', route: '/admin/advertisements' },
    { icon: 'fas fa-users', label: 'User List', route: '/admin/user-list' },
    { icon: 'fas fa-user-plus', label: 'Register User', route: '/admin/user-registration' },
    { icon: 'fas fa-chart-bar', label: 'Reports', route: '/admin/reports' },
    { icon: 'fas fa-cog', label: 'Settings', route: '/admin/settings' }
  ];

  categories = ['Announcement', 'News', 'Update'];

  constructor(private announcementService: AnnouncementService) {}

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  getEmptyForm(): Announcement {
    return {
      title: '',
      summary: '',
      content: '',
      category: 'Announcement',
      date_published: new Date().toISOString().split('T')[0],
      is_urgent: false
    };
  }

  loadAnnouncements(): void {
    this.loading = true;
    this.announcementService.getAnnouncement().subscribe({
      next: (data) => {
        this.announcements = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading announcements:', err);
        this.errorMessage = 'Failed to load announcements.';
        this.loading = false;
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.formData = this.getEmptyForm();
    this.editingAnnouncement = null;
    this.selectedImage = null;
    this.imagePreview = null;
    this.existingImageUrl = null;
    this.successMessage = '';
    this.errorMessage = '';
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Please select a valid image file (JPEG, PNG, GIF, or WebP).';
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'Image file size must be less than 5MB.';
        return;
      }
      
      this.selectedImage = file;
      this.errorMessage = '';
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.existingImageUrl = null;
  }

  editAnnouncement(announcement: Announcement): void {
    this.editingAnnouncement = { ...announcement };
    this.formData = { 
      ...announcement,
      date_published: announcement.date_published ? announcement.date_published.split('T')[0] : new Date().toISOString().split('T')[0]
    };
    this.existingImageUrl = announcement.image_url || null;
    this.imagePreview = announcement.image_url || null;
    this.selectedImage = null;
    this.showForm = true;
  }

  deleteAnnouncement(id: number): void {
    if (confirm('Are you sure you want to delete this announcement?')) {
      this.announcementService.deleteAnnouncement(id).subscribe({
        next: () => {
          this.successMessage = 'Announcement deleted successfully!';
          this.loadAnnouncements();
        },
        error: (err: any) => {
          console.error('Error deleting announcement:', err);
          this.errorMessage = 'Failed to delete announcement.';
        }
      });
    }
  }

  onSubmit(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.formData.title || !this.formData.summary || !this.formData.category) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.loading = true;

    if (this.editingAnnouncement && this.editingAnnouncement.id) {
      // Update existing
      this.announcementService.updateAnnouncement(this.editingAnnouncement.id, this.formData, this.selectedImage || undefined).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.successMessage = 'Announcement updated successfully!';
          this.resetForm();
          this.showForm = false;
          this.loadAnnouncements();
        },
        error: (err: any) => {
          this.loading = false;
          console.error('Update error:', err);
          this.errorMessage = err.error?.message || 'Failed to update announcement.';
        }
      });
    } else {
      // Create new
      this.announcementService.createAnnouncement(this.formData, this.selectedImage || undefined).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.successMessage = 'Announcement created successfully!';
          this.resetForm();
          this.loadAnnouncements();
        },
        error: (err: any) => {
          this.loading = false;
          console.error('Create error:', err);
          this.errorMessage = err.error?.message || 'Failed to create announcement.';
        }
      });
    }
  }

  getCategoryClass(category: string): string {
    switch (category) {
      case 'Announcement': return 'badge-announcement';
      case 'News': return 'badge-news';
      case 'Update': return 'badge-update';
      default: return 'badge-announcement';
    }
  }

  getUrgentClass(isUrgent: boolean): string {
    return isUrgent ? 'badge-urgent' : 'badge-false';
  }

  getGradient(color: string): string {
    const gradients: { [key: string]: string } = {
      green: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      blue: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      yellow: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      indigo: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
    };
    return gradients[color] || gradients['green'];
  }
}

