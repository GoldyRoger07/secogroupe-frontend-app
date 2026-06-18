import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { Observable, of } from 'rxjs';

import { SettingsService } from '../../core/services/settings.service';
import { CurrentUserService } from '../../core/services/current-user.service';
import {
  AppearancePrefs,
  CompanySettings,
  LoginEntry,
  NotificationPrefs,
  SecuritySettings,
  UserProfile,
} from '../../core/models/settings.models';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

interface NavSection { id: string; label: string; icon: string; }

@Component({
  selector: 'app-settings',
  imports: [
    FormsModule, ReactiveFormsModule, DatePipe,
    ButtonModule, InputTextModule, SelectModule, RadioButtonModule,
    DividerModule, TextareaModule, PasswordModule, ToastModule,
    TagModule, ToggleSwitchModule, TooltipModule, SkeletonModule,
  ],
  providers: [MessageService],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;

  private readonly fb             = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly settingsService = inject(SettingsService);
  readonly currentUser            = inject(CurrentUserService);

  activeSection = signal<string>('profile');
  saving        = signal(false);
  loading       = signal(false);
  photoPreview  = signal<string | null>(null);
  private pendingPhotoFile: File | null = null;

  private readonly allSections: NavSection[] = [
    { id: 'general',       label: 'Général',        icon: 'pi pi-building'    },
    { id: 'profile',       label: 'Mon profil',      icon: 'pi pi-user'        },
    { id: 'appearance',    label: 'Apparence',       icon: 'pi pi-palette'     },
    { id: 'notifications', label: 'Notifications',   icon: 'pi pi-bell'        },
    { id: 'security',      label: 'Sécurité',        icon: 'pi pi-shield'      },
  ];

  get sections(): NavSection[] {
    return this.allSections.filter(
      s => s.id !== 'general' || this.currentUser.hasRole('ADMIN')
    );
  }

  /* ── Général ─────────────────────────────────────────────── */
  general: CompanySettings = {
    companyName: 'SecoGroupe', companyEmail: 'contact@secogroupe.com',
    companyPhone: '+33 1 23 45 67 89', website: 'www.secogroupe.com',
    address: '12 Rue de la Paix, 75001 Paris',
    timezone: 'Europe/Paris', dateFormat: 'dd/MM/yyyy', language: 'fr',
  };

  timezoneOptions = [
    { label: '(UTC+1) Europe/Paris',      value: 'Europe/Paris'      },
    { label: '(UTC+0) UTC',               value: 'UTC'               },
    { label: '(UTC-5) America/New_York',  value: 'America/New_York'  },
    { label: '(UTC+9) Asia/Tokyo',        value: 'Asia/Tokyo'        },
    { label: '(UTC+1) Africa/Casablanca', value: 'Africa/Casablanca' },
  ];
  languageOptions = [
    { label: 'Français', value: 'fr' }, { label: 'English', value: 'en' },
    { label: 'Español',  value: 'es' }, { label: 'Deutsch',  value: 'de' },
  ];
  dateFormatOptions = [
    { label: 'JJ/MM/AAAA  (31/12/2026)', value: 'dd/MM/yyyy' },
    { label: 'MM/JJ/AAAA  (12/31/2026)', value: 'MM/dd/yyyy' },
    { label: 'AAAA-MM-JJ  (2026-12-31)', value: 'yyyy-MM-dd' },
  ];

  /* ── Profil ──────────────────────────────────────────────── */
  profile: UserProfile = {
    firstName: '', lastName: '', email: '',
    phone: '', position: '', bio: '',
  };

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  /* ── Apparence ───────────────────────────────────────────── */
  appearance: AppearancePrefs = {
    theme: 'light', density: 'normal', fontSize: '14', sidebarColor: 'blue',
  };
  fontSizeOptions = [
    { label: 'Petite (12px)',  value: '12' },
    { label: 'Normale (14px)', value: '14' },
    { label: 'Grande (16px)',  value: '16' },
  ];

  /* ── Notifications ───────────────────────────────────────── */
  notifications: NotificationPrefs = {
    emailEnabled: true, loginAlerts: true, weeklyReport: false,
    newRegistrations: true, securityAlerts: true,
    maintenanceAlerts: false, exportCompleted: true,
  };

  /* ── Sécurité ────────────────────────────────────────────── */
  security: SecuritySettings = {
    twoFactorAuth: false, sessionDuration: '8h',
    enforceStrongPasswords: true, passwordExpiry: false, singleSession: false,
  };
  sessionDurationOptions = [
    { label: '15 minutes', value: '15m' }, { label: '30 minutes', value: '30m' },
    { label: '1 heure',    value: '1h'  }, { label: '4 heures',   value: '4h'  },
    { label: '8 heures',   value: '8h'  }, { label: 'Jamais',     value: 'never' },
  ];

  recentLogins: Array<LoginEntry & { dateObj: Date }> = [];

  /* ── Lifecycle ───────────────────────────────────────────── */
  ngOnInit(): void {
    this.loadSection('profile');
    this.settingsService.getAppearance().subscribe({ next: d => this.appearance = d, error: () => {} });
    this.settingsService.getNotifications().subscribe({ next: d => this.notifications = d, error: () => {} });
    this.settingsService.getSecuritySettings().subscribe({ next: d => this.security = d, error: () => {} });
    this.settingsService.getLoginHistory().subscribe({
      next: items => this.recentLogins = items.map(l => ({ ...l, dateObj: new Date(l.date) })),
      error: () => {}
    });
    if (this.currentUser.hasRole('ADMIN')) {
      this.settingsService.getGeneral().subscribe({ next: d => this.general = d, error: () => {} });
    }
  }

  navigateTo(sectionId: string): void {
    this.activeSection.set(sectionId);
    this.loadSection(sectionId);
  }

  private loadSection(id: string): void {
    switch (id) {
      case 'profile':
        this.loading.set(true);
        this.settingsService.getProfile().subscribe({
          next: d => {
            this.profile = d;
            if (d.photoUrl) this.photoPreview.set(d.photoUrl);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
        break;
    }
  }

  /* ── Actions ─────────────────────────────────────────────── */
  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.pendingPhotoFile = file;
    const reader = new FileReader();
    reader.onload = (e) => this.photoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.photoPreview.set(null);
    this.pendingPhotoFile = null;
    if (this.photoInput) this.photoInput.nativeElement.value = '';
  }

  save(section: string): void {
    this.saving.set(true);
    const s = section;
    let call$: Observable<unknown>;

    switch (s) {
      case 'general':
        call$ = this.settingsService.updateGeneral(this.general);
        break;
      case 'profile':
        if (this.pendingPhotoFile) {
          this.settingsService.uploadProfilePhoto(this.pendingPhotoFile).subscribe({
            next: res => { this.profile.photoUrl = res.photoUrl; this.pendingPhotoFile = null; },
            error: () => {}
          });
        }
        call$ = this.settingsService.updateProfile(this.profile);
        break;
      case 'appearance':
        call$ = this.settingsService.updateAppearance(this.appearance);
        break;
      case 'notifications':
        call$ = this.settingsService.updateNotifications(this.notifications);
        break;
      case 'security':
        call$ = this.settingsService.updateSecuritySettings(this.security);
        break;
      default:
        call$ = of(null);
    }

    call$.subscribe({
      next: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'success', summary: 'Enregistré', detail: 'Paramètres sauvegardés avec succès', life: 3000 });
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.error ?? 'Échec de la sauvegarde';
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: msg, life: 4000 });
      },
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Les mots de passe ne correspondent pas' });
      return;
    }
    this.saving.set(true);
    this.settingsService.changePassword({
      currentPassword: this.passwordForm.value.currentPassword!,
      newPassword: newPassword!,
      confirmPassword: confirmPassword!,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'success', summary: 'Mot de passe mis à jour', detail: 'Votre mot de passe a été changé avec succès', life: 3000 });
        this.passwordForm.reset();
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.error ?? 'Échec du changement de mot de passe';
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: msg, life: 4000 });
      },
    });
  }

  disconnectAll(): void {
    this.settingsService.disconnectAll().subscribe({
      next: () => this.messageService.add({ severity: 'warn', summary: 'Sessions terminées', detail: 'Toutes les sessions ont été déconnectées', life: 3000 }),
      error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la déconnexion', life: 3000 }),
    });
  }

  getLoginSeverity(success: boolean): Severity {
    return success ? 'success' : 'danger';
  }

  hasPassError(field: string, error: string): boolean {
    const ctrl = this.passwordForm.get(field);
    return !!(ctrl?.errors?.[error] && ctrl.touched);
  }
}
