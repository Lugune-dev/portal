import { Component } from '@angular/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class Footer {
  currentLang: string = 'en';
  currentYear: number = new Date().getFullYear();

  constructor(public languageService: LanguageService) {
    this.languageService.getLanguageObservable().subscribe(lang => {
      this.currentLang = lang;
    });
  }
}
