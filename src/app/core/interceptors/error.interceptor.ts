import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthRepository } from '../../modules/user/repositories/auth.repository';
import { ToastService } from '../services/toast.service';
import { SILENT_ERROR } from '../services/api.service';

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
      } else if (err.status !== 0 && !req.context.get(SILENT_ERROR)) {
        // Jangan tampilkan toast untuk error jaringan mentah (status 0) atau
        // request yang sengaja ditandai silent (mis. kartu WhatsApp opsional
        // di halaman pengajuan shortlink — errornya sudah ditangani presenter).
        toast.error(message);
      }
      return throwError(() => err);
    }),
  );
};
