import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { BadgeModule } from 'primeng/badge';
import { MessageService, ConfirmationService } from 'primeng/api';
import { RoleService } from '../../core/services/role.service';
import { PermissionService } from '../../core/services/permission.service';
import { Role, RoleRequest } from '../../core/models/role.models';
import { Permission } from '../../core/models/permission.models';

@Component({
  selector: 'app-role-list',
  imports: [
    ReactiveFormsModule, FormsModule, DatePipe,
    TableModule, ButtonModule, InputTextModule, TextareaModule, MultiSelectModule,
    TagModule, DialogModule, TooltipModule, IconFieldModule,
    InputIconModule, SkeletonModule, BadgeModule, PaginatorModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './role-list.html',
  styleUrl: './role-list.css',
})
export class RoleList implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly permissionService = inject(PermissionService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  roles = signal<Role[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = false;
  editingRole = signal<Role | null>(null);
  allPermissions = signal<Permission[]>([]);

  viewMode = signal<'table' | 'grid'>('table');
  pageSize = 10;
  gridFirst = 0;
  gridRows = 12;
  searchQuery = '';
  private lastLazyEvent: TableLazyLoadEvent | null = null;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    permissionIds: [[] as number[]],
  });

  ngOnInit(): void {
    this.permissionService.getList().subscribe(perms => this.allPermissions.set(perms));
  }

  get permissionOptions() {
    return this.allPermissions().map(p => ({ label: p.name, value: p.id, description: p.description }));
  }

  loadData(event?: TableLazyLoadEvent): void {
    if (event) this.lastLazyEvent = event;
    const ev = this.lastLazyEvent;
    this.loading.set(true);

    const page = ev ? Math.floor((ev.first ?? 0) / (ev.rows ?? this.pageSize)) : 0;
    const size = ev?.rows ?? this.pageSize;
    const sortField = typeof ev?.sortField === 'string' ? ev.sortField : '';
    const sortOrder = ev?.sortOrder === -1 ? 'desc' : 'asc';

    this.roleService.getAll({ page, size, sortField, sortOrder, globalFilter: this.searchQuery }).subscribe({
      next: (res) => {
        this.roles.set(res.content);
        this.totalRecords.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Chargement échoué' });
      },
    });
  }

  onSearch(): void {
    this.lastLazyEvent = this.lastLazyEvent ? { ...this.lastLazyEvent, first: 0 } : null;
    this.gridFirst = 0;
    this.loadData();
  }

  setViewMode(mode: 'table' | 'grid'): void {
    this.viewMode.set(mode);
    if (mode === 'grid') {
      this.loadData({ first: 0, rows: this.gridRows });
      this.gridFirst = 0;
    } else {
      this.loadData(this.lastLazyEvent ?? undefined);
    }
  }

  onGridPageChange(event: any): void {
    this.gridFirst = event.first;
    this.gridRows = event.rows;
    this.loadData({ first: event.first, rows: event.rows });
  }

  openDialog(role?: Role): void {
    this.editingRole.set(role ?? null);
    if (role) {
      this.form.patchValue({ name: role.name, description: role.description, permissionIds: role.permissionIds });
    } else {
      this.form.reset({ permissionIds: [] });
    }
    this.dialogVisible = true;
  }

  saveRole(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.form.value;
    const req: RoleRequest = {
      name: val.name!,
      description: val.description || '',
      permissionIds: val.permissionIds ?? [],
    };
    const editing = this.editingRole();
    const obs = editing ? this.roleService.update(editing.id, req) : this.roleService.create(req);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: editing ? 'Rôle modifié' : 'Rôle créé' });
        this.loadData();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Opération échouée' });
      },
    });
  }

  confirmDelete(role: Role): void {
    this.confirmationService.confirm({
      message: `Supprimer le rôle <strong>${role.name}</strong> ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.roleService.delete(role.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Supprimé', detail: 'Rôle supprimé' });
            this.loadData();
          },
        });
      },
    });
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.errors?.[error] && ctrl.touched);
  }
}
