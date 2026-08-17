import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthApiService } from '../services/auth-api.service';
import { AuthSessionService } from '../services/auth-session.service';
import { AuthResult } from '../entities/auth-result';
import { UserProfile } from '../entities/user';
import { submissionPath } from '../../submission/submission.path';

/**
 * Sumber kebenaran sesi pengguna aplikasi: menyimpan token & profil,
 * dan mengorkestrasi seluruh panggilan /auth/*. Disuntik langsung oleh
 * guard, interceptor, dan layout — analog dengan UserRepository/AuthRepository
 * di phantom-lancer.
 */
@Injectable({ providedIn: 'root' })
export class AuthRepository {
  private api = inject(AuthApiService);
  private session = inject(AuthSessionService);

  readonly user = signal<UserProfile | null>(this.session.loadUser());
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly isVerified = computed(() => this.user()?.emailVerified ?? false);

  get accessToken(): string | null { return this.session.accessToken; }
  get refreshToken(): string | null { return this.session.refreshToken; }

  register(body: { fullName: string; email: string; password: string; passwordConfirmation: string }): Observable<unknown> {
    return this.api.register(body);
  }

  login(body: { email: string; password: string }): Observable<AuthResult> {
    return this.api.login(body).pipe(tap((res) => this.applySession(res)));
  }

  loginGoogle(idToken: string): Observable<AuthResult> {
    return this.api.loginGoogle(idToken).pipe(tap((res) => this.applySession(res)));
  }

  verifyEmail(token: string): Observable<unknown> {
    return this.api.verifyEmail(token);
  }

  resendVerification(): Observable<unknown> {
    return this.api.resendVerification();
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.api.forgotPassword(email);
  }

  resetPassword(body: { token: string; password: string; passwordConfirmation: string }): Observable<unknown> {
    return this.api.resetPassword(body);
  }

  changePassword(body: { oldPassword: string; newPassword: string }): Observable<unknown> {
    return this.api.changePassword(body);
  }

  refreshMe(): Observable<UserProfile> {
    return this.api.me().pipe(tap((u) => { this.session.persistUser(u); this.user.set(u); }));
  }

  hasPermission(code: string): boolean {
    return this.user()?.permissions.includes(code) ?? false;
  }

  /** Apakah pengguna memiliki akses ke CMS (setidaknya satu permission). */
  hasAnyCmsAccess(): boolean {
    return (this.user()?.permissions.length ?? 0) > 0;
  }

  /**
   * Halaman CMS tujuan setelah login — null bila akun tidak punya akses CMS
   * sama sekali. Dashboard dirancang per tier organisasi (LDK/Puskomda/
   * Puskomnas); akun tanpa tier organisasi (Kader — self-service, bukan
   * tier CMS resmi, lihat DL-12) diarahkan ke Pendataan alih-alih Dashboard
   * yang tidak punya widget untuknya (backend menolaknya dengan 403).
   */
  defaultCmsPath(): string | null {
    const u = this.user();
    if (!u || u.permissions.length === 0) return null;
    const hasOrganizationTier = !!u.organizationTypeCode || (u.wildcardTierAccess?.length ?? 0) > 0;
    if (!hasOrganizationTier && u.permissions.includes('submission.create')) return submissionPath.pendataan;
    return '/cms/dashboard';
  }

  logout(): void {
    this.session.clear();
    this.user.set(null);
  }

  private applySession(res: AuthResult): void {
    this.session.persist(res);
    this.user.set(res.user);
  }
}
