export interface CompanySettings {
  id?: number;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  website: string;
  address: string;
  timezone: string;
  dateFormat: string;
  language: string;
}

export interface UserProfile {
  id?: number;
  username?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  bio: string;
  photoUrl?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AppearancePrefs {
  theme: 'light' | 'dark' | 'system';
  density: 'compact' | 'normal' | 'comfortable';
  fontSize: string;
  sidebarColor: 'blue' | 'dark' | 'gray';
}

export interface NotificationPrefs {
  emailEnabled: boolean;
  loginAlerts: boolean;
  weeklyReport: boolean;
  newRegistrations: boolean;
  securityAlerts: boolean;
  maintenanceAlerts: boolean;
  exportCompleted: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionDuration: string;
  enforceStrongPasswords: boolean;
  passwordExpiry: boolean;
  singleSession: boolean;
}

export interface LoginEntry {
  date: string;
  device: string;
  ip: string;
  location: string;
  success: boolean;
}
