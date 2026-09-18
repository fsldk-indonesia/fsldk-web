import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthRepository } from '../../modules/user/repositories/auth.repository';
import { environment } from '../../../environments/environment';

/** Menyisipkan header Authorization: Bearer <token> pada request terproteksi.
 *  Hanya untuk request ke FSLDK API sendiri (apiBaseUrl) — request ke API
 *  pihak ketiga (mis. wilayah.service.ts memanggil emsifa wilayah indonesia
 *  langsung lewat HttpClient, bukan ApiService) dilewati apa adanya supaya
 *  tidak menambahkan header custom yang memicu CORS preflight (OPTIONS) ke
 *  host statis yang tidak menanganinya. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthRepository);
  const token = auth.accessToken;
  if (token && req.url.startsWith(environment.apiBaseUrl)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
