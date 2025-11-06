import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './careers.html',
  styleUrls: ['./careers.css']
})
export class CareersComponent {
  jobOpenings = [
    {
      id: 1,
      title: 'Senior Plant Pathologist',
      department: 'Plant Health Division',
      location: 'Dar es Salaam',
      type: 'Full-time',
      deadline: '2024-02-15',
      description: 'Lead research and diagnostic activities for plant diseases affecting Tanzanian agriculture.',
      requirements: [
        'PhD in Plant Pathology or related field',
        '5+ years of experience in plant disease diagnostics',
        'Strong research and publication record',
        'Experience with molecular diagnostic techniques'
      ]
    },
    {
      id: 2,
      title: 'Quarantine Inspector',
      department: 'Plant Quarantine Section',
      location: 'Various Ports',
      type: 'Full-time',
      deadline: '2024-02-28',
      description: 'Conduct inspections of imported and exported plants and plant products at border points.',
      requirements: [
        'Bachelor\'s degree in Agriculture, Biology, or related field',
        'Knowledge of plant quarantine regulations',
        'Attention to detail and ability to work in field conditions',
        'Valid driver\'s license'
      ]
    },
    {
      id: 3,
      title: 'Data Analyst',
      department: 'Information Technology',
      location: 'Dar es Salaam',
      type: 'Full-time',
      deadline: '2024-03-10',
      description: 'Analyze plant health data and develop reporting systems for TPHPA operations.',
      requirements: [
        'Bachelor\'s degree in Computer Science, Statistics, or related field',
        'Proficiency in data analysis tools (R, Python, SQL)',
        'Experience with data visualization',
        'Knowledge of agricultural data systems preferred'
      ]
    },
    {
      id: 4,
      title: 'Extension Officer',
      department: 'Extension Services',
      location: 'Regional Offices',
      type: 'Full-time',
      deadline: '2024-03-20',
      description: 'Provide technical support and training to farmers and stakeholders on plant health issues.',
      requirements: [
        'Bachelor\'s degree in Agriculture or related field',
        'Experience in agricultural extension work',
        'Strong communication and training skills',
        'Willingness to travel to rural areas'
      ]
    },
    {
      id: 5,
      title: 'Laboratory Technician',
      department: 'Plant Health Laboratory',
      location: 'Dar es Salaam',
      type: 'Full-time',
      deadline: '2024-03-30',
      description: 'Support laboratory operations for plant pest and disease diagnostics.',
      requirements: [
        'Diploma in Laboratory Technology or related field',
        'Experience in laboratory work',
        'Knowledge of basic microbiological techniques',
        'Attention to detail and safety protocols'
      ]
    }
  ];

  benefits = [
    {
      icon: 'fas fa-money-bill-wave',
      title: 'Competitive Salary',
      description: 'Attractive compensation packages aligned with government pay scales'
    },
    {
      icon: 'fas fa-user-md',
      title: 'Health Insurance',
      description: 'Comprehensive medical coverage for you and your family'
    },
    {
      icon: 'fas fa-graduation-cap',
      title: 'Professional Development',
      description: 'Opportunities for training, workshops, and career advancement'
    },
    {
      icon: 'fas fa-balance-scale',
      title: 'Work-Life Balance',
      description: 'Flexible working arrangements and generous leave policies'
    },
    {
      icon: 'fas fa-users',
      title: 'Team Environment',
      description: 'Collaborative workplace with dedicated professionals'
    },
    {
      icon: 'fas fa-leaf',
      title: 'Environmental Impact',
      description: 'Contribute to protecting Tanzania\'s agricultural sector'
    }
  ];

  getTypeColor(type: string): string {
    return type === 'Full-time' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  }

  applyForJob(jobId: number): void {
    // Navigate to application form or open modal
    console.log('Applying for job:', jobId);
  }
}
