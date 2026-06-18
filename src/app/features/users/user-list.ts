import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SkeletonModule } from 'primeng/skeleton';
import { PasswordModule } from 'primeng/password';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserService } from '../../core/services/user.service';
import { User, UserRequest, UserStatus } from '../../core/models/user.models';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-user-list',
  imports: [
    ReactiveFormsModule, FormsModule, DatePipe,
    TableModule, ButtonModule, InputTextModule, SelectModule,
    TagModule, DialogModule, TooltipModule, IconFieldModule,
    InputIconModule, FloatLabelModule, SkeletonModule, PasswordModule,
    PaginatorModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList implements OnInit {
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  users = signal<User[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = false;
  editingUser = signal<User | null>(null);

  viewMode = signal<'table' | 'grid'>('table');
  pageSize = 10;
  gridFirst = 0;
  gridRows = 12;
  searchQuery = '';
  private lastLazyEvent: TableLazyLoadEvent | null = null;

  statusOptions = [
    { label: 'Actif', value: 'ACTIVE' },
    { label: 'Inactif', value: 'INACTIVE' },
    { label: 'Suspendu', value: 'SUSPENDED' },
  ];

  roleOptions = [
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Manager', value: 'MANAGER' },
    { label: 'Employé', value: 'EMPLOYEE' },
    { label: 'Lecteur', value: 'VIEWER' },
  ];

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    roleName: ['EMPLOYEE', Validators.required],
    status: ['ACTIVE' as UserStatus, Validators.required],
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

    this.userService.getAll({ page, size, sortField, sortOrder, globalFilter: this.searchQuery }).subscribe({
      next: (res) => {
        this.users.set(res.content);
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

  openDialog(user?: User): void {
    this.editingUser.set(user ?? null);
    if (user) {
      this.form.patchValue({ username: user.username, email: user.email, roleName: user.roleName, status: user.status });
      this.form.get('password')?.clearValidators();
    } else {
      this.form.reset({ roleName: 'EMPLOYEE', status: 'ACTIVE' });
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    this.form.get('password')?.updateValueAndValidity();
    this.dialogVisible = true;
  }

  saveUser(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.form.value;
    const req: UserRequest = {
      username: val.username!,
      email: val.email!,
      password: val.password || undefined,
      roleName: val.roleName!,
      status: val.status as UserStatus,
    };
    const editing = this.editingUser();
    const obs = editing ? this.userService.update(editing.id, req) : this.userService.create(req);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: editing ? 'Utilisateur modifié' : 'Utilisateur créé' });
        this.loadData();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Opération échouée' });
      },
    });
  }

  confirmDelete(user: User): void {
    this.confirmationService.confirm({
      message: `Supprimer l'utilisateur <strong>${user.username}</strong> ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.userService.delete(user.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Supprimé', detail: 'Utilisateur supprimé' });
            this.loadData();
          },
        });
      },
    });
  }

  getStatusSeverity(status: UserStatus): Severity {
    const map: Record<UserStatus, Severity> = { ACTIVE: 'success', INACTIVE: 'danger', SUSPENDED: 'warn' };
    return map[status];
  }

  getStatusLabel(status: UserStatus): string {
    const map: Record<UserStatus, string> = { ACTIVE: 'Actif', INACTIVE: 'Inactif', SUSPENDED: 'Suspendu' };
    return map[status];
  }

  getRoleSeverity(role: string): Severity {
    const map: Record<string, Severity> = { ADMIN: 'danger', MANAGER: 'warn', EMPLOYEE: 'info', VIEWER: 'secondary' };
    return map[role] ?? 'secondary';
  }

  getInitial(username: string): string {
    return username.charAt(0).toUpperCase();
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.errors?.[error] && ctrl.touched);
  }
}
