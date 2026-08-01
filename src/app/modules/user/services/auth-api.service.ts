import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthResult } from '../entities/auth-result';
import { UserProfile } from '../entities/user';

/** Panggilan HTTP mentah ke endpoint /auth/*. */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private api = inject(ApiService);

  register(body: { fullName: string; email: string; password: string; passwordConfirmation: string }): Observable<unknown> {
    return this.api.post('/auth/register', body);
  }

  login(body: { email: string; password: string }): Observable<AuthResult> {
    return this.api.post<AuthResult>('/auth/login', body);
  }

  loginGoogle(idToken: string): Observable<AuthResult> {
    return this.api.post<AuthResult>('/auth/google', { idToken });
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

  me(): Observable<UserProfile> {
    return this.api.get<UserProfile>('/auth/me');
  }
}
