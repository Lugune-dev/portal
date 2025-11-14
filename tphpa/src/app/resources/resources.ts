import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf, RouterModule, FormsModule],
  templateUrl: './resources.html',
  styleUrls: ['./resources.css']
})
export class ResourcesComponent implements OnInit {
  resources = [
    {
      id: 1,
      title: 'Plant Health Training Manual',
      description: 'Comprehensive training materials for plant health inspectors and officers.',
      date: '2023-12-01',
      type: 'Training Material',
      downloadUrl: '#'
    },
    {
      id: 2,
      title: 'Pest Identification Guide',
      description: 'Visual guide for identifying common plant pests in Tanzania.',
      date: '2023-11-15',
      type: 'Guide',
      downloadUrl: '#'
    },
    {
      id: 3,
      title: 'Laboratory Procedures Handbook',
      description: 'Standard operating procedures for plant health laboratories.',
      date: '2023-10-20',
      type: 'Handbook',
      downloadUrl: '#'
    },
    {
      id: 4,
      title: 'Emergency Response Protocols',
      description: 'Guidelines for handling plant health emergencies and outbreaks.',
      date: '2023-09-10',
      type: 'Protocol',
      downloadUrl: '#'
    },
    {
      id: 5,
      title: 'Data Collection Templates',
      description: 'Standardized templates for collecting plant health data and statistics.',
      date: '2023-08-25',
      type: 'Template',
      downloadUrl: '#'
    },
    {
      id: 6,
      title: 'Stakeholder Engagement Toolkit',
      description: 'Tools and resources for engaging with stakeholders in plant health programs.',
      date: '2023-07-30',
      type: 'Toolkit',
      downloadUrl: '#'
    }
  ];

  categories = ['All', 'Training Material', 'Guide', 'Handbook', 'Protocol', 'Template', 'Toolkit'];
  selectedCategory = 'All';
  searchTerm = '';
  filteredResources = this.resources;
  loading = false;

  ngOnInit() {
    this.filterResources();
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filterResources();
  }

  filterResources() {
    this.filteredResources = this.resources.filter(resource => {
      const matchesCategory = this.selectedCategory === 'All' || resource.type === this.selectedCategory;
      const matchesSearch = resource.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           resource.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  clearFilters() {
    this.selectedCategory = 'All';
    this.searchTerm = '';
    this.filterResources();
  }

  loadMore() {
    this.loading = true;
    // Simulate loading more resources
    setTimeout(() => {
      // In a real app, this would fetch more data from an API
      this.loading = false;
    }, 1000);
  }

  trackByResource(index: number, resource: any): number {
    return resource.id;
  }

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'Training Material': 'bg-g-900 text-green-900',
      'Guide': 'bg-green-900 text-green-800',
      'Handbook': 'bg-green-900 text-purple-800',
      'Protocol': 'bg-green-900 text-orange-800',
      'Template': 'bg-green-900 text-red-800',
      'Toolkit': 'bg-green-900 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  getTypeBgColor(type: string): string {
    const colors: { [key: string]: string } = {
      'Training Material': 'bg-green-900',
      'Guide': 'bg-green-600',
      'Handbook': 'bg-green-900',
      'Protocol': 'bg-green-900',
      'Template': 'bg-green-900',
      'Toolkit': 'bg-green-900'
    };
    return colors[type] || 'bg-gray-600';
  }

  getTypeGradient(type: string): string {
    const gradients: { [key: string]: string } = {
      'Training Material': 'from-primary-700 to-primary-800',
      'Guide': 'from-primary-700 to-primary-800',
      'Handbook': 'from-primary-700 to-primary-800',
      'Protocol': 'from-primary-700 to-primary-800',
      'Template': 'from-primary-700 to-primary-800',
      'Toolkit': 'from-primary-700 to-primary-800'
    };
    return gradients[type] || 'from-gray-500 to-gray-600';
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'Training Material': 'fas fa-book-open',
      'Guide': 'fas fa-map-signs',
      'Handbook': 'fas fa-book',
      'Protocol': 'fas fa-clipboard-list',
      'Template': 'fas fa-file-alt',
      'Toolkit': 'fas fa-tools'
    };
    return icons[type] || 'fas fa-file';
  }
}
