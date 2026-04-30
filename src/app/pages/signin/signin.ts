import { Component } from '@angular/core';

import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'app-signin',
  imports: [FloatLabelModule, InputTextModule, ButtonModule, TranslatePipe],
  templateUrl: './signin.html',
  styleUrl: './signin.css',
})
export class Signin {

}
