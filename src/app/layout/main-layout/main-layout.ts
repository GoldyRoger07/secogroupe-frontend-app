import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
  permission?: string;
}

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastModule, ConfirmDialogModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  private readonly authService = inject(AuthService);
  readonly currentUser = inject(CurrentUserService);

  collapsed = signal(false);

  private readonly allNavItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'pi pi-home',   route: '/dashboard',             exact: true                    },
    { label: 'Utilisateurs',    icon: 'pi pi-users',   route: '/dashboard/users',       permission: 'READ_USER'        },
    { label: 'Employés',        icon: 'pi pi-id-card', route: '/dashboard/employees',   permission: 'READ_EMPLOYEE'    },
    { label: 'Rôles',           icon: 'pi pi-shield',  route: '/dashboard/roles',       permission: 'READ_ROLE'        },
    { label: 'Permissions',     icon: 'pi pi-lock',    route: '/dashboard/permissions', permission: 'READ_PERMISSION'  },
    { label: 'Paramètres',      icon: 'pi pi-cog',     route: '/dashboard/settings'                                    },
  ];

  get navItems(): NavItem[] {
    return this.allNavItems.filter(
      item => !item.permission || this.currentUser.hasPermission(item.permission)
    );
  }

  toggle(): void {
    this.collapsed.update(v => !v);
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
