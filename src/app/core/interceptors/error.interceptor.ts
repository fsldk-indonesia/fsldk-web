import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthRepository } from '../../modules/user/repositories/auth.repository';
import { ToastService } from '../services/toast.service';

/**
 * Menangani error HTTP global: memetakan pesan, menampilkan toast, dan
 * mengarahkan sesuai status (401 → login, 403 EMAIL_NOT_VERIFIED → verifikasi).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthRepository);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const body = err.error;
      const fieldMessages = Array.isArray(body?.errors)
        ? (body.errors as { message?: string }[]).map((e) => e.message).filter(Boolean).join(', ')
        : '';
      const message = fieldMessages || body?.message || 'Terjadi kesalahan. Silakan coba lagi.';
      const code = body?.code as string | undefined;

      if (err.status === 401) {
        if (auth.isLoggedIn()) {
          auth.logout();
          router.navigate(['/login']);
        }
      } else if (err.status === 403 && code === '43-EMAIL') {
        router.navigate(['/verifikasi-email']);
      } else if (err.status !== 0) {
        // Jangan tampilkan toast untuk error jaringan mentah (status 0).
        toast.error(message);
      }
      return throwError(() => err);
    }),
  );
};
