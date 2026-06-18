import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AppearancePrefs,
  CompanySettings,
  LoginEntry,
  NotificationPrefs,
  PasswordChangeRequest,
  SecuritySettings,
  UserProfile,
} from '../models/settings.models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/settings`;

  // General
  getGeneral(): Observable<CompanySettings> {
    return this.http.get<CompanySettings>(`${this.base}/general`);
  }
  updateGeneral(data: CompanySettings): Observable<CompanySettings> {
    return this.http.put<CompanySettings>(`${this.base}/general`, data);
  }

  // Profile
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/profile`);
  }
  updateProfile(data: UserProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/profile`, data);
  }
  uploadProfilePhoto(file: File): Observable<{ photoUrl: string }> {
    const fd = new FormData();
    fd.append('photo', file);
    return this.http.post<{ photoUrl: string }>(`${this.base}/profile/photo`, fd);
  }
  changePassword(data: PasswordChangeRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/password`, data);
  }

  // Appearance
  getAppearance(): Observable<AppearancePrefs> {
    return this.http.get<AppearancePrefs>(`${this.base}/appearance`);
  }
  updateAppearance(data: AppearancePrefs): Observable<AppearancePrefs> {
    return this.http.put<AppearancePrefs>(`${this.base}/appearance`, data);
  }

  // Notifications
  getNotifications(): Observable<NotificationPrefs> {
    return this.http.get<NotificationPrefs>(`${this.base}/notifications`);
  }
  updateNotifications(data: NotificationPrefs): Observable<NotificationPrefs> {
    return this.http.put<NotificationPrefs>(`${this.base}/notifications`, data);
  }

  // Security
  getSecuritySettings(): Observable<SecuritySettings> {
    return this.http.get<SecuritySettings>(`${this.base}/security`);
  }
  updateSecuritySettings(data: SecuritySettings): Observable<SecuritySettings> {
    return this.http.put<SecuritySettings>(`${this.base}/security`, data);
  }

  // Login history & disconnect
  getLoginHistory(): Observable<LoginEntry[]> {
    return this.http.get<LoginEntry[]>(`${this.base}/login-history`);
  }
  disconnectAll(): Observable<void> {
    return this.http.post<void>(`${this.base}/disconnect-all`, {});
  }
}
