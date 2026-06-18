import { Routes } from '@angular/router';
import { Signin } from './pages/signin/signin';
import { Signup } from './pages/signup/signup';
import { VerifyOtp } from './pages/verify-otp/verify-otp';
import { authGuard, publicGuard } from './core/guards/auth.guard';
import { MainLayout } from './layout/main-layout/main-layout';
import { Dashboard } from './features/dashboard/dashboard';
import { UserList } from './features/users/user-list';
import { EmployeeList } from './features/employees/employee-list';
import { RoleList } from './features/roles/role-list';
import { PermissionList } from './features/permissions/permission-list';
import { Settings } from './features/settings/settings';

export const routes: Routes = [
  { path: '', redirectTo: 'signin', pathMatch: 'full' },
  { path: 'signin', component: Signin, canActivate: [publicGuard] },
  { path: 'signup', component: Signup, canActivate: [publicGuard] },
  { path: 'verify-otp', component: VerifyOtp, canActivate: [publicGuard] },
  {
    path: 'dashboard',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', component: Dashboard },
      { path: 'users', component: UserList },
      { path: 'employees', component: EmployeeList },
      { path: 'roles', component: RoleList },
      { path: 'permissions', component: PermissionList },
      { path: 'settings', component: Settings },
    ],
  },
  { path: '**', redirectTo: 'signin' },
];
