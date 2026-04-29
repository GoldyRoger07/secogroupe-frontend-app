import { Component } from '@angular/core';

import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-signin',
  imports: [FloatLabelModule, InputTextModule, ButtonModule],
  templateUrl: './signin.html',
  styleUrl: './signin.css',
})
export class Signin {

}
