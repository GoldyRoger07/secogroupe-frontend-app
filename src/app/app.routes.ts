import { Routes } from '@angular/router';
import { Signin } from './pages/signin/signin';
import { Signup } from './pages/signup/signup';
import { VerifyOtp } from './pages/verify-otp/verify-otp';
import { authGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'signin', pathMatch: 'full' },
  { path: 'signin', component: Signin, canActivate: [publicGuard] },
  { path: 'signup', component: Signup, canActivate: [publicGuard] },
  { path: 'verify-otp', component: VerifyOtp, canActivate: [publicGuard] },
];
