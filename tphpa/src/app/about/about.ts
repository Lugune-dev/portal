import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.html',
  styleUrls: ['./about.css']
})
export class AboutComponent {
  mission = {
    title: 'Our Mission',
    description: 'To protect and promote plant health in Tanzania through effective quarantine measures, pest and disease management, and capacity building for sustainable agriculture.',
    icon: 'fas fa-bullseye'
  };

  vision = {
    title: 'Our Vision',
    description: 'To be a leading plant health protection authority in Africa, ensuring food security and sustainable agricultural development in Tanzania.',
    icon: 'fas fa-eye'
  };

  values = [
    {
      title: 'Excellence',
      description: 'We strive for the highest standards in plant health protection and service delivery.',
      icon: 'fas fa-star'
    },
    {
      title: 'Integrity',
      description: 'We conduct our work with honesty, transparency, and ethical practices.',
      icon: 'fas fa-shield-alt'
    },
    {
      title: 'Innovation',
      description: 'We embrace new technologies and approaches to improve plant health management.',
      icon: 'fas fa-lightbulb'
    },
    {
      title: 'Collaboration',
      description: 'We work closely with stakeholders for effective plant health protection.',
      icon: 'fas fa-handshake'
    },
    {
      title: 'Sustainability',
      description: 'We promote environmentally sustainable plant health practices.',
      icon: 'fas fa-leaf'
    },
    {
      title: 'Professionalism',
      description: 'We maintain high professional standards in all our operations.',
      icon: 'fas fa-user-tie'
    }
  ];

  history = [
    {
      year: '1970',
      title: 'Establishment',
      description: 'TPHPA was established as the Plant Protection Division under the Ministry of Agriculture.'
    },
    {
      year: '1985',
      title: 'Expansion',
      description: 'Expanded operations with establishment of regional offices and laboratories across Tanzania.'
    },
    {
      year: '2000',
      title: 'Modernization',
      description: 'Adopted modern plant quarantine procedures and established electronic documentation systems.'
    },
    {
      year: '2010',
      title: 'Digital Transformation',
      description: 'Implemented digital systems for pest risk analysis and import/export certification.'
    },
    {
      year: '2020',
      title: 'COVID-19 Response',
      description: 'Successfully managed plant health during the pandemic while ensuring food security.'
    },
    {
      year: '2023',
      title: 'Innovation Hub',
      description: 'Established as a center of excellence for plant health research and training in East Africa.'
    }
  ];

  leadership = [
    {
      name: 'Dr. Sarah Nkomo',
      position: 'Director General',
      image: '/assets/images/leadership/dg.jpg',
      bio: 'Dr. Nkomo has over 20 years of experience in plant pathology and agricultural policy. She holds a PhD from the University of Nairobi and has led several international plant health initiatives.'
    },
    {
      name: 'Mr. James Mwanga',
      position: 'Deputy Director General',
      image: '/assets/images/leadership/ddg.jpg',
      bio: 'Mr. Mwanga specializes in plant quarantine regulations and international trade. He has represented Tanzania in numerous WTO and FAO plant health negotiations.'
    },
    {
      name: 'Dr. Amina Hassan',
      position: 'Director of Plant Health',
      image: '/assets/images/leadership/director-health.jpg',
      bio: 'Dr. Hassan leads research on emerging plant diseases and develops diagnostic protocols. She has published extensively on tropical plant pathology.'
    }
  ];

  statistics = [
    { number: '50+', label: 'Years of Service', icon: 'fas fa-calendar' },
    { number: '25', label: 'Regional Offices', icon: 'fas fa-map-marker-alt' },
    { number: '500+', label: 'Staff Members', icon: 'fas fa-users' },
    { number: '1000+', label: 'Pest Interceptions', icon: 'fas fa-shield-alt' },
    { number: '95%', label: 'Certification Accuracy', icon: 'fas fa-check-circle' },
    { number: '30+', label: 'Partner Countries', icon: 'fas fa-globe' }
  ];
}
