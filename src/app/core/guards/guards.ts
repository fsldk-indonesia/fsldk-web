import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthRepository } from '../../modules/user/repositories/auth.repository';
import { ToastService } from '../services/toast.service';

/** Memastikan pengguna sudah login; simpan URL tujuan sebagai returnUrl bila belum. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthRepository);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/** Mencegah pengguna yang sudah login mengakses halaman login/daftar. */
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthRepository);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  router.navigateByUrl(auth.defaultCmsPath() ?? '/');
  return false;
};

/**
 * Memastikan email pengguna sudah terverifikasi. Signal `user()` di memori
 * bisa basi (mis. link verifikasi dibuka di tab/perangkat lain), tapi
 * sekadar refresh PROFIL (refreshMe/GET /auth/me) tidak cukup — access
 * token yang sudah terbit tetap membawa klaim emailVerified LAMA (di-embed
 * saat token pertama kali terbit) untuk request API berikutnya, jadi
 * endpoint yang dijaga RequireVerified() di backend (submissions, dst.)
 * tetap 403 walau tampilan sudah bilang terverifikasi. Dipakai
 * refreshSession() (POST /auth/refresh-token) yang menerbitkan token BARU
 * dengan klaim terkini dari DB — ini yang menghilangkan kebutuhan
 * logout-login ulang (miss-development-prompt-2.md poin 3 & prompt-3.md
 * poin 8, akar masalah sesungguhnya baru ditemukan di percobaan ini).
 */
export const verifiedGuard: CanActivateFn = (): Observable<boolean> => {
  const auth = inject(AuthRepository);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return of(false);
  }
  if (auth.isVerified()) return of(true);
  return auth.refreshSession().pipe(
    map(() => {
      if (auth.isVerified()) return true;
      router.navigate(['/verifikasi-email']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/verifikasi-email']);
      return of(false);
    }),
  );
};

/** Memastikan pengguna memiliki permission tertentu (data: { permission }). */
export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthRepository);
  const router = inject(Router);
  const toast = inject(ToastService);
  const required = route.data?.['permission'] as string | undefined;
  if (!required || auth.hasPermission(required)) return true;
  toast.error('Anda tidak memiliki hak akses untuk halaman ini');
  router.navigateByUrl(auth.defaultCmsPath() ?? '/');
  return false;
};
