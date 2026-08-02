import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthResult } from '../../../user/entities/auth-result';
import { LoginView } from './login.view';

@Injectable()
export class LoginPresenter extends BasePresenter<LoginView> {
  private authRepo = inject(AuthRepository);
  private toast = inject(ToastService);

  submit(email: string, password: string): void {
    if (!email || !password) { this.toast.error('Email dan kata sandi wajib diisi'); return; }
    this.view.setLoading(true);
    this.authRepo.login({ email, password }).subscribe({
      next: (res) => this.onSuccess(res),
      error: () => this.view.setLoading(false),
    });
  }

  loginGoogle(idToken?: string): void {
    if (!idToken) { this.toast.info('Login Google memerlukan konfigurasi Google Client ID pada environment.'); return; }
    this.view.setLoading(true);
    this.authRepo.loginGoogle(idToken).subscribe({
      next: (res) => this.onSuccess(res),
      error: () => this.view.setLoading(false),
    });
  }

  private onSuccess(res: AuthResult): void {
    this.view.setLoading(false);
    this.toast.success('Selamat datang, ' + res.user.fullName);
    if (res.user.emailVerified) this.view.navigateAfterLogin(res.user.permissions.length > 0);
    else this.view.navigateToVerifyEmail();
  }
}
