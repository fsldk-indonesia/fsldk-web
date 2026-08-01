import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/** Memastikan pengguna sudah login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};

/** Mencegah pengguna yang sudah login mengakses halaman login/daftar. */
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  router.navigate(['/cms/dashboard']);
  return false;
};

/** Memastikan email pengguna sudah terverifikasi. */
export const verifiedGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isVerified()) return true;
  if (auth.isLoggedIn()) {
    router.navigate(['/verifikasi-email']);
  } else {
    router.navigate(['/login']);
  }
  return false;
};

/** Memastikan pengguna memiliki permission tertentu (data: { permission }). */
export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const required = route.data?.['permission'] as string | undefined;
  if (!required || auth.hasPermission(required)) return true;
  toast.error('Anda tidak memiliki hak akses untuk halaman ini');
  router.navigate(['/cms/dashboard']);
  return false;
};
