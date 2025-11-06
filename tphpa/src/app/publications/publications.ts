import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-publications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './publications.html',
  styleUrls: ['./publications.css']
})
export class PublicationsComponent {
  publications = [
    {
      id: 1,
      title: 'TPHPA Annual Report 2023',
      description: 'Comprehensive annual report covering TPHPA activities, achievements, and future plans.',
      date: '2023-12-15',
      type: 'Annual Report',
      downloadUrl: '#'
    },
    {
      id: 2,
      title: 'Plant Health Protection Guidelines',
      description: 'Official guidelines for plant health protection and quarantine procedures in Tanzania.',
      date: '2023-11-20',
      type: 'Guidelines',
      downloadUrl: '#'
    },
    {
      id: 3,
      title: 'Pest Risk Analysis Manual',
      description: 'Detailed manual for conducting pest risk analysis for imported and exported plants.',
      date: '2023-10-10',
      type: 'Manual',
      downloadUrl: '#'
    },
    {
      id: 4,
      title: 'TPHPA Strategic Plan 2024-2028',
      description: 'Strategic plan outlining TPHPA objectives and initiatives for the next five years.',
      date: '2023-09-05',
      type: 'Strategic Plan',
      downloadUrl: '#'
    },
    {
      id: 5,
      title: 'Plant Quarantine Regulations',
      description: 'Complete set of regulations governing plant quarantine activities in Tanzania.',
      date: '2023-08-15',
      type: 'Regulations',
      downloadUrl: '#'
    },
    {
      id: 6,
      title: 'Research Bulletin - Volume 12',
      description: 'Latest research findings on plant health, pest management, and agricultural innovations.',
      date: '2023-07-22',
      type: 'Research Bulletin',
      downloadUrl: '#'
    }
  ];

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'Annual Report': 'bg-blue-100 text-blue-800',
      'Guidelines': 'bg-green-100 text-green-800',
      'Manual': 'bg-purple-100 text-purple-800',
      'Strategic Plan': 'bg-orange-100 text-orange-800',
      'Regulations': 'bg-red-100 text-red-800',
      'Research Bulletin': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }
}
