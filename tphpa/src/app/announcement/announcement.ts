import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnnouncementService } from '../services/announcement';

@Component({
  selector: 'app-component',
  templateUrl: './announcement.html',
  styleUrls: ['./announcement.css'],
  imports: [CommonModule]
 })
export class AnnouncementComponent implements OnInit {
    updates: any[] = [];

    constructor(private announcementService: AnnouncementService) { }
    ngOnInit(): void {
    this.announcementService.getAnnouncement().subscribe((data: any[]) =>{
     this.updates=data;
    });
    }
}
