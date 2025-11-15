import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 'translate',
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private subscription: Subscription = new Subscription();
  private currentValue: string = '';

  constructor(private languageService: LanguageService) {
    this.subscription = this.languageService.getLanguageObservable().subscribe(() => {
      // Force pipe to re-evaluate when language changes
    });
  }

  transform(key: string): string {
    return this.languageService.translate(key);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
