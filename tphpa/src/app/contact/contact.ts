import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.css']
})
export class ContactComponent {
  contactForm!: FormGroup;
  submitted = false;

  contactInfo = [
    {
      type: 'Head Office',
      icon: 'fas fa-building',
      title: 'Main Office',
      details: [
        'TPHPA Headquarters',
        'Plot No. 113, Mikocheni B',
        'Dar es Salaam, Tanzania'
      ]
    },
    {
      type: 'Phone',
      icon: 'fas fa-phone',
      title: 'Phone Numbers',
      details: [
        '+255 22 221 1111 (General)',
        '+255 22 221 1112 (Plant Health)',
        '+255 22 221 1113 (Quarantine)'
      ]
    },
    {
      type: 'Email',
      icon: 'fas fa-envelope',
      title: 'Email Addresses',
      details: [
        'info@tphpa.go.tz (General)',
        'planthealth@tphpa.go.tz (Technical)',
        'quarantine@tphpa.go.tz (Import/Export)'
      ]
    },
    {
      type: 'Hours',
      icon: 'fas fa-clock',
      title: 'Working Hours',
      details: [
        'Monday - Friday: 8:00 AM - 5:00 PM',
        'Saturday: 8:00 AM - 12:00 PM',
        'Sunday: Closed',
        'Emergency: 24/7 Available'
      ]
    }
  ];

  regionalOffices = [
    {
      name: 'Arusha Regional Office',
      address: 'Plot 45, Njiro Hill, Arusha',
      phone: '+255 27 254 1234',
      email: 'arusha@tphpa.go.tz'
    },
    {
      name: 'Mwanza Regional Office',
      address: 'Plot 123, Nyakato, Mwanza',
      phone: '+255 28 250 5678',
      email: 'mwanza@tphpa.go.tz'
    },
    {
      name: 'Mbeya Regional Office',
      address: 'Plot 78, Mbalizi Road, Mbeya',
      phone: '+255 25 250 9012',
      email: 'mbeya@tphpa.go.tz'
    },
    {
      name: 'Dodoma Regional Office',
      address: 'Plot 156, Central Business District, Dodoma',
      phone: '+255 26 232 3456',
      email: 'dodoma@tphpa.go.tz'
    }
  ];

  emergencyContacts = [
    {
      service: 'Plant Pest Emergency',
      number: '+255 759 123 456',
      description: 'For immediate reporting of suspected plant pests or diseases'
    },
    {
      service: 'Import Quarantine Issues',
      number: '+255 759 123 457',
      description: 'For urgent matters related to imported plant materials'
    },
    {
      service: 'Export Certification',
      number: '+255 759 123 458',
      description: 'For time-sensitive export documentation requirements'
    }
  ];

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  initializeForm() {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      this.submitted = true;
      // Handle form submission logic here (e.g., send to backend)
      console.log('Form submitted:', this.contactForm.value);
    }
  }
}
