import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import {
  AuthResponse,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  VerifyOtpRequest,
} from '../models/auth.models';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  private readonly baseUrl = 'http://localhost:8080/auth';

  register(request: RegisterRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}/register`, request, { responseType: 'text' });
  }

  verifyOtp(request: VerifyOtpRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}/verify-otp`, request, { responseType: 'text' });
  }

  verifyEmail(token: string): Observable<string> {
    const params = new HttpParams().set('token', token);
    return this.http.get(`${this.baseUrl}/verify-email`, { params, responseType: 'text' });
  }

  resendVerification(email: string): Observable<string> {
    const params = new HttpParams().set('email', email);
    return this.http.post(`${this.baseUrl}/resend-verification`, null, { params, responseType: 'text' });
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap((res) => this.tokenService.setTokens(res.accessToken, res.refreshToken))
    );
  }

  refresh(request: RefreshRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, request).pipe(
      tap((res) => this.tokenService.setTokens(res.accessToken, res.refreshToken))
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => {
        this.tokenService.clearTokens();
        this.router.navigate(['/signin']);
      })
    );
  }
}
