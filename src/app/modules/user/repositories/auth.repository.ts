import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthApiService } from '../services/auth-api.service';
import { AuthSessionService } from '../services/auth-session.service';
import { AuthResult } from '../entities/auth-result';
import { UserProfile } from '../entities/user';

/** Peringkat tier organisasi tertinggi (0 = tidak ada) — dipakai untuk
 *  visibilitas link CMS hierarkis ke bawah (miss-development-clarification.md
 *  bagian C): tier sendiri + seluruh tier di bawahnya. */
const TIER_RANK: Record<string, number> = { LDK: 1, PUSKOMDA: 2, PUSKOMNAS: 3 };

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

  /** Peringkat tier tertinggi yang dapat diakses akun (0 = tidak ada tier organisasi). */
  private tierRank(): number {
    const u = this.user();
    if (!u) return 0;
    let rank = TIER_RANK[u.organizationTypeCode ?? ''] ?? 0;
    for (const t of u.wildcardTierAccess ?? []) rank = Math.max(rank, TIER_RANK[t] ?? 0);
    return rank;
  }

  /** Akses CMS Utama (FSLDK) — ditandai permission admin sistem yang hanya dimiliki Super Admin. */
  hasUtamaCmsAccess(): boolean { return this.hasPermission('role.view'); }
  hasPuskomnasCmsAccess(): boolean { return this.tierRank() >= 3; }
  hasPuskomdaCmsAccess(): boolean { return this.tierRank() >= 2; }
  hasLdkCmsAccess(): boolean { return this.tierRank() >= 1; }

  /** Apakah pengguna memiliki akses ke setidaknya satu CMS (Utama atau ber-tier). */
  hasAnyCmsAccess(): boolean {
    return this.hasUtamaCmsAccess() || this.hasLdkCmsAccess();
  }

  /**
   * Apakah akun ini akun self-service Kader (Pengunjung/Kader — tanpa tier
   * organisasi, tanpa akses CMS Utama, tapi punya izin isi Sensus Kader).
   * Dipakai navbar akun untuk menampilkan "Daftar Kader"/"Lihat Status
   * Kader"/"Portal Kader" (lihat KaderNavState di public-layout).
   */
  isKaderSelfService(): boolean {
    return !this.hasAnyCmsAccess() && this.hasPermission('submission.create');
  }

  /**
   * Halaman tujuan setelah login — null bila akun tidak punya akses ke
   * CMS/Portal Kader manapun. Tiap tier organisasi punya shell CMS-nya
   * sendiri (poin 1-4 miss-development); akun tanpa tier organisasi tapi
   * berhak isi Sensus Kader diarahkan ke Portal Kader (kader/ringkasan),
   * bukan Dashboard CMS yang tidak punya widget untuknya.
   */
  defaultCmsPath(): string | null {
    const u = this.user();
    if (!u) return null;
    if (this.hasUtamaCmsAccess()) return '/cms/dashboard';
    if (this.hasPuskomnasCmsAccess()) return '/cms-puskomnas/dashboard';
    if (this.hasPuskomdaCmsAccess()) return '/cms-puskomda/dashboard';
    if (this.hasLdkCmsAccess()) return '/cms-ldk/dashboard';
    if (this.isKaderSelfService()) return '/kader/ringkasan';
    return null;
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
