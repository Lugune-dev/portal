import { Pipe, PipeTransform } from '@angular/core';
import { Observable, map } from 'rxjs';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 'translate',
  pure: false
})
export class TranslatePipe implements PipeTransform {
  constructor(private languageService: LanguageService) {}

  transform(key: string): Observable<string> {
    return this.languageService.getLanguageObservable().pipe(
      map(() => this.languageService.translate(key))
    );
  }
}
