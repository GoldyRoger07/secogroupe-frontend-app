import { inject, Injectable, signal } from '@angular/core';
import { TokenService } from './token.service';

export interface CurrentUser {
  username: string;
  initial: string;
  authorities: string[];
}

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly tokenService = inject(TokenService);

  private readonly _user = signal<CurrentUser>(this.buildUser());
  readonly user = this._user.asReadonly();

  refresh(): void { this._user.set(this.buildUser()); }

  clear(): void { this._user.set({ username: '', initial: '', authorities: [] }); }

  hasPermission(permission: string): boolean {
    return this._user().authorities.includes(permission);
  }

  hasAnyPermission(...permissions: string[]): boolean {
    return permissions.some(p => this._user().authorities.includes(p));
  }

  hasRole(role: string): boolean {
    return this._user().authorities.includes(`ROLE_${role}`);
  }

  private buildUser(): CurrentUser {
    const username = this.tokenService.getUsername();
    const authorities = this.tokenService.getAuthorities();
    return { username, initial: username.charAt(0).toUpperCase() || '?', authorities };
  }
}
