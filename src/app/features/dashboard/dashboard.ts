import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { EmployeeService } from '../../core/services/employee.service';
import { RoleService } from '../../core/services/role.service';
import { PermissionService } from '../../core/services/permission.service';
import { CurrentUserService } from '../../core/services/current-user.service';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import { PageResponse } from '../../core/models/page.models';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  route: string;
  permission: string;
}

interface QuickLink {
  label: string;
  icon: string;
  route: string;
  color: string;
  permission: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly userService       = inject(UserService);
  private readonly employeeService   = inject(EmployeeService);
  private readonly roleService       = inject(RoleService);
  private readonly permissionService = inject(PermissionService);
  readonly currentUser               = inject(CurrentUserService);

  loading = signal(true);

  today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  private readonly allStats: StatCard[] = [
    { label: 'Utilisateurs', value: 0, icon: 'pi pi-users',   color: '#0078d4', route: '/dashboard/users',       permission: 'READ_USER'       },
    { label: 'Employés',     value: 0, icon: 'pi pi-id-card', color: '#107c10', route: '/dashboard/employees',   permission: 'READ_EMPLOYEE'   },
    { label: 'Rôles',        value: 0, icon: 'pi pi-shield',  color: '#8764b8', route: '/dashboard/roles',       permission: 'READ_ROLE'       },
    { label: 'Permissions',  value: 0, icon: 'pi pi-lock',    color: '#d83b01', route: '/dashboard/permissions', permission: 'READ_PERMISSION' },
  ];

  stats = signal<StatCard[]>(this.allStats);

  private readonly allQuickLinks: QuickLink[] = [
    { label: 'Ajouter un utilisateur', icon: 'pi pi-user-plus',   route: '/dashboard/users',       color: '#0078d4', permission: 'CREATE_USER'       },
    { label: 'Ajouter un employé',     icon: 'pi pi-plus-circle', route: '/dashboard/employees',   color: '#107c10', permission: 'CREATE_EMPLOYEE'   },
    { label: 'Gérer les rôles',        icon: 'pi pi-shield',      route: '/dashboard/roles',       color: '#8764b8', permission: 'READ_ROLE'         },
    { label: 'Gérer les permissions',  icon: 'pi pi-key',         route: '/dashboard/permissions', color: '#d83b01', permission: 'READ_PERMISSION'   },
    { label: 'Paramètres',             icon: 'pi pi-cog',         route: '/dashboard/settings',    color: '#605e5c', permission: ''                  },
  ];

  get visibleStats(): StatCard[] {
    return this.stats().filter(s => this.currentUser.hasPermission(s.permission));
  }

  get visibleQuickLinks(): QuickLink[] {
    return this.allQuickLinks.filter(
      l => !l.permission || this.currentUser.hasPermission(l.permission)
    );
  }

  ngOnInit(): void {
    const empty = { totalElements: -1, content: [], totalPages: 0, page: 0, size: 0 };
    const safe = (obs: Observable<PageResponse<any>>) =>
      obs.pipe(catchError(() => of(empty)));

    const pageReq = { page: 0, size: 1 };
    forkJoin({
      users:       safe(this.userService.getAll(pageReq)),
      employees:   safe(this.employeeService.getAll(pageReq)),
      roles:       safe(this.roleService.getAll(pageReq)),
      permissions: safe(this.permissionService.getAll(pageReq)),
    }).subscribe((res) => {
      this.stats.update(s => [
        { ...s[0], value: res.users.totalElements },
        { ...s[1], value: res.employees.totalElements },
        { ...s[2], value: res.roles.totalElements },
        { ...s[3], value: res.permissions.totalElements },
      ]);
      this.loading.set(false);
    });
  }
}
