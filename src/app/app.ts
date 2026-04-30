import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService, TranslatePipe, TranslateDirective} from "@ngx-translate/core";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  // protected readonly title = signal('app');
  private translate = inject(TranslateService);
  
  constructor(translate: TranslateService) {
      this.translate.addLangs(['fr', 'en']);
      this.translate.setFallbackLang('en');
      this.translate.use('en');
  }



}
