import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'Training Material': 'bg-blue-100 text-blue-800',
      'Guide': 'bg-green-100 text-green-800',
      'Handbook': 'bg-purple-100 text-purple-800',
      'Protocol': 'bg-orange-100 text-orange-800',
      'Template': 'bg-red-100 text-red-800',
      'Toolkit': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  getTypeBgColor(type: string): string {
    const colors: { [key: string]: string } = {
      'Training Material': 'bg-blue-600',
      'Guide': 'bg-green-600',
      'Handbook': 'bg-purple-600',
      'Protocol': 'bg-orange-600',
      'Template': 'bg-red-600',
      'Toolkit': 'bg-indigo-600'
    };
    return colors[type] || 'bg-gray-600';
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
