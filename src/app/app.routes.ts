import { Routes } from '@angular/router';
import { Signin } from './pages/signin/signin';
import { Signup } from './pages/signup/signup';

export const routes: Routes = [
    {path: 'signin', component: Signin},
    {path: 'signup', component: Signup}
];
