import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthRepository } from '../../modules/user/repositories/auth.repository';

/** Menyisipkan header Authorization: Bearer <token> pada request terproteksi. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthRepository);
  const token = auth.accessToken;
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
