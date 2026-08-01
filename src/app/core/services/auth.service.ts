import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResult, UserProfile } from '../models/models';

const ACCESS_KEY = 'fsldk.accessToken';
const REFRESH_KEY = 'fsldk.refreshToken';
const USER_KEY = 'fsldk.user';

/** Layanan autentikasi: registrasi, login (lokal & Google), verifikasi, sesi. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);

  readonly user = signal<UserProfile | null>(this.loadUser());
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly isVerified = computed(() => this.user()?.emailVerified ?? false);

  private loadUser(): UserProfile | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  }

  get accessToken(): string | null { return localStorage.getItem(ACCESS_KEY); }
  get refreshToken(): string | null { return localStorage.getItem(REFRESH_KEY); }

  private persist(res: AuthResult): void {
    localStorage.setItem(ACCESS_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.user.set(res.user);
  }

  register(body: { fullName: string; email: string; password: string; passwordConfirmation: string }): Observable<unknown> {
    return this.api.post('/auth/register', body);
  }

  login(body: { email: string; password: string }): Observable<AuthResult> {
    return this.api.post<AuthResult>('/auth/login', body).pipe(tap((res) => this.persist(res)));
  }

  loginGoogle(idToken: string): Observable<AuthResult> {
    return this.api.post<AuthResult>('/auth/google', { idToken }).pipe(tap((res) => this.persist(res)));
  }

  verifyEmail(token: string): Observable<unknown> {
    return this.api.get(`/auth/email/verify/${token}`);
  }

  resendVerification(): Observable<unknown> {
    return this.api.post('/auth/email/resend');
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.api.post('/auth/forgot-password', { email });
  }

  resetPassword(body: { token: string; password: string; passwordConfirmation: string }): Observable<unknown> {
    return this.api.post('/auth/reset-password', body);
  }

  changePassword(body: { oldPassword: string; newPassword: string }): Observable<unknown> {
    return this.api.post('/auth/change-password', body);
  }

  refreshMe(): Observable<UserProfile> {
    return this.api.get<UserProfile>('/auth/me').pipe(tap((u) => {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      this.user.set(u);
    }));
  }

  hasPermission(code: string): boolean {
    return this.user()?.permissions.includes(code) ?? false;
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
  }
}
