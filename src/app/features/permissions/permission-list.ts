import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PermissionService } from '../../core/services/permission.service';
import { Permission, PermissionRequest } from '../../core/models/permission.models';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

const MODULE_COLORS: Record<string, Severity> = {
  USERS: 'info', EMPLOYEES: 'success', ROLES: 'warn',
  PERMISSIONS: 'danger', REPORTS: 'secondary', SETTINGS: 'contrast', AUDIT: 'secondary',
};

@Component({
  selector: 'app-permission-list',
  imports: [
    ReactiveFormsModule, FormsModule, DatePipe,
    TableModule, ButtonModule, InputTextModule, TextareaModule, SelectModule,
    TagModule, DialogModule, TooltipModule, IconFieldModule,
    InputIconModule, SkeletonModule, PaginatorModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './permission-list.html',
  styleUrl: './permission-list.css',
})
export class PermissionList implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  permissions = signal<Permission[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = false;
  editingPermission = signal<Permission | null>(null);

  viewMode = signal<'table' | 'grid'>('table');
  pageSize = 10;
  gridFirst = 0;
  gridRows = 12;
  searchQuery = '';
  moduleFilter: string | null = null;
  actionFilter: string | null = null;
  private lastLazyEvent: TableLazyLoadEvent | null = null;

  moduleOptions = [
    { label: 'Utilisateurs', value: 'USERS' },
    { label: 'Employés', value: 'EMPLOYEES' },
    { label: 'Rôles', value: 'ROLES' },
    { label: 'Permissions', value: 'PERMISSIONS' },
    { label: 'Rapports', value: 'REPORTS' },
    { label: 'Paramètres', value: 'SETTINGS' },
    { label: 'Audit', value: 'AUDIT' },
  ];

  actionOptions = [
    { label: 'Consulter', value: 'READ' },
    { label: 'Créer', value: 'CREATE' },
    { label: 'Modifier', value: 'UPDATE' },
    { label: 'Supprimer', value: 'DELETE' },
    { label: 'Exporter', value: 'EXPORT' },
    { label: 'Importer', value: 'IMPORT' },
  ];

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    module: ['', Validators.required],
    action: ['', Validators.required],
  });

  ngOnInit(): void {}

  loadData(event?: TableLazyLoadEvent): void {
    if (event) this.lastLazyEvent = event;
    const ev = this.lastLazyEvent;
    this.loading.set(true);

    const page = ev ? Math.floor((ev.first ?? 0) / (ev.rows ?? this.pageSize)) : 0;
    const size = ev?.rows ?? this.pageSize;
    const sortField = typeof ev?.sortField === 'string' ? ev.sortField : '';
    const sortOrder = ev?.sortOrder === -1 ? 'desc' : 'asc';

    let filter = this.searchQuery;
    if (this.moduleFilter) filter = this.moduleFilter;
    if (this.actionFilter) filter = this.actionFilter;

    this.permissionService.getAll({ page, size, sortField, sortOrder, globalFilter: this.searchQuery }).subscribe({
      next: (res) => {
        let content = res.content;
        if (this.moduleFilter) content = content.filter(p => p.module === this.moduleFilter);
        if (this.actionFilter) content = content.filter(p => p.action === this.actionFilter);
        this.permissions.set(content);
        this.totalRecords.set(this.moduleFilter || this.actionFilter ? content.length : res.totalElements);
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

  onFilter(): void {
    this.onSearch();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.moduleFilter = null;
    this.actionFilter = null;
    this.onSearch();
  }

  openDialog(permission?: Permission): void {
    this.editingPermission.set(permission ?? null);
    if (permission) {
      this.form.patchValue(permission);
    } else {
      this.form.reset();
    }
    this.dialogVisible = true;
  }

  onModuleChange(): void {
    const module = this.form.get('module')?.value;
    const action = this.form.get('action')?.value;
    if (module && action) {
      this.form.get('name')?.setValue(`${module}_${action}`);
    }
  }

  savePermission(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const req = this.form.value as PermissionRequest;
    const editing = this.editingPermission();
    const obs = editing ? this.permissionService.update(editing.id, req) : this.permissionService.create(req);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: editing ? 'Permission modifiée' : 'Permission créée' });
        this.loadData();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Opération échouée' });
      },
    });
  }

  confirmDelete(permission: Permission): void {
    this.confirmationService.confirm({
      message: `Supprimer la permission <strong>${permission.name}</strong> ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.permissionService.delete(permission.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Supprimé', detail: 'Permission supprimée' });
            this.loadData();
          },
        });
      },
    });
  }

  getModuleSeverity(module: string): Severity {
    return MODULE_COLORS[module] ?? 'secondary';
  }

  getActionLabel(action: string): string {
    const map: Record<string, string> = { READ: 'Lire', CREATE: 'Créer', UPDATE: 'Modifier', DELETE: 'Supprimer', EXPORT: 'Exporter', IMPORT: 'Importer' };
    return map[action] ?? action;
  }

  hasFilters(): boolean {
    return !!(this.searchQuery || this.moduleFilter || this.actionFilter);
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.errors?.[error] && ctrl.touched);
  }
}
