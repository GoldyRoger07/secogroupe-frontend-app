import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { EmployeeService } from '../../core/services/employee.service';
import { Employee, EmployeeRequest, EmployeeStatus } from '../../core/models/employee.models';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-employee-list',
  imports: [
    ReactiveFormsModule, FormsModule, DatePipe,
    TableModule, ButtonModule, InputTextModule, SelectModule,
    TagModule, DialogModule, TooltipModule, IconFieldModule,
    InputIconModule, SkeletonModule, AvatarModule, PaginatorModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css',
})
export class EmployeeList implements OnInit {
  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;

  private readonly employeeService = inject(EmployeeService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  employees = signal<Employee[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = false;
  editingEmployee = signal<Employee | null>(null);
  photoPreview = signal<string | null>(null);
  selectedPhoto: File | null = null;

  viewMode = signal<'table' | 'grid'>('table');
  pageSize = 10;
  gridFirst = 0;
  gridRows = 9;
  searchQuery = '';
  private lastLazyEvent: TableLazyLoadEvent | null = null;

  statusOptions = [
    { label: 'Actif', value: 'ACTIVE' },
    { label: 'Inactif', value: 'INACTIVE' },
    { label: 'En congé', value: 'ON_LEAVE' },
  ];

  departmentOptions = [
    { label: 'IT', value: 'IT' },
    { label: 'RH', value: 'RH' },
    { label: 'Finance', value: 'Finance' },
    { label: 'Marketing', value: 'Marketing' },
    { label: 'Opérations', value: 'Opérations' },
    { label: 'Commercial', value: 'Commercial' },
  ];

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    position: ['', Validators.required],
    department: ['', Validators.required],
    status: ['ACTIVE' as EmployeeStatus, Validators.required],
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

    this.employeeService.getAll({ page, size, sortField, sortOrder, globalFilter: this.searchQuery }).subscribe({
      next: (res) => {
        this.employees.set(res.content);
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

  openDialog(employee?: Employee): void {
    this.editingEmployee.set(employee ?? null);
    this.photoPreview.set(employee?.photoUrl ?? null);
    this.selectedPhoto = null;
    if (employee) {
      this.form.patchValue({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        status: employee.status,
      });
    } else {
      this.form.reset({ status: 'ACTIVE' });
    }
    this.dialogVisible = true;
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedPhoto = file;
    const reader = new FileReader();
    reader.onload = (e) => this.photoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.photoPreview.set(null);
    this.selectedPhoto = null;
    if (this.photoInput) this.photoInput.nativeElement.value = '';
  }

  saveEmployee(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.form.value;
    const req: EmployeeRequest = {
      firstName: val.firstName!,
      lastName: val.lastName!,
      email: val.email!,
      phone: val.phone!,
      position: val.position!,
      department: val.department!,
      status: val.status as EmployeeStatus,
    };
    const editing = this.editingEmployee();
    const obs = editing
      ? this.employeeService.update(editing.id, req, this.selectedPhoto ?? undefined)
      : this.employeeService.create(req, this.selectedPhoto ?? undefined);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: editing ? 'Employé modifié' : 'Employé créé' });
        this.loadData();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Opération échouée' });
      },
    });
  }

  confirmDelete(employee: Employee): void {
    this.confirmationService.confirm({
      message: `Supprimer l'employé <strong>${employee.firstName} ${employee.lastName}</strong> ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.employeeService.delete(employee.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Supprimé', detail: 'Employé supprimé' });
            this.loadData();
          },
        });
      },
    });
  }

  getStatusSeverity(status: EmployeeStatus): Severity {
    const map: Record<EmployeeStatus, Severity> = { ACTIVE: 'success', INACTIVE: 'danger', ON_LEAVE: 'warn' };
    return map[status];
  }

  getStatusLabel(status: EmployeeStatus): string {
    const map: Record<EmployeeStatus, string> = { ACTIVE: 'Actif', INACTIVE: 'Inactif', ON_LEAVE: 'En congé' };
    return map[status];
  }

  getInitials(emp: Employee): string {
    return (emp.firstName.charAt(0) + emp.lastName.charAt(0)).toUpperCase();
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.errors?.[error] && ctrl.touched);
  }
}
