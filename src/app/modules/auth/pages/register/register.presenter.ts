import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthResult } from '../../../user/entities/auth-result';
import { RegisterView } from './register.view';

@Injectable()
export class RegisterPresenter extends BasePresenter<RegisterView> {
  private authRepo = inject(AuthRepository);
  private toast = inject(ToastService);

  submit(fullName: string, email: string, password: string, confirm: string): void {
    if (password !== confirm) { this.toast.error('Konfirmasi kata sandi tidak cocok'); return; }
    if (password.length < 8) { this.toast.error('Kata sandi minimal 8 karakter'); return; }
    this.view.setLoading(true);
    this.authRepo.register({ fullName, email, password, passwordConfirmation: confirm }).subscribe({
      next: () => {
        this.view.setLoading(false);
        this.toast.success('Registrasi berhasil! Silakan cek email untuk verifikasi.');
        this.view.navigateToVerifyEmail(email);
      },
      error: () => this.view.setLoading(false),
    });
  }

  registerGoogle(idToken?: string): void {
    if (!idToken) { this.toast.info('Daftar dengan Google memerlukan konfigurasi Google Client ID pada environment.'); return; }
    this.view.setLoading(true);
    this.authRepo.loginGoogle(idToken).subscribe({
      next: (res) => this.onGoogleSuccess(res),
      error: () => this.view.setLoading(false),
    });
  }

  private onGoogleSuccess(res: AuthResult): void {
    this.view.setLoading(false);
    this.toast.success('Selamat datang, ' + res.user.fullName);
    if (res.user.emailVerified) this.view.navigateAfterLogin(this.authRepo.defaultCmsPath());
    else this.view.navigateToVerifyEmail(res.user.email);
  }
}
