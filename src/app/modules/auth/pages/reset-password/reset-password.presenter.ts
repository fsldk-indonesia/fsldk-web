import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { ResetPasswordView } from './reset-password.view';

@Injectable()
export class ResetPasswordPresenter extends BasePresenter<ResetPasswordView> {
  private authRepo = inject(AuthRepository);
  private toast = inject(ToastService);

  submit(token: string, password: string, confirm: string): void {
    if (password !== confirm) { this.toast.error('Konfirmasi kata sandi tidak cocok'); return; }
    if (password.length < 8) { this.toast.error('Kata sandi minimal 8 karakter'); return; }
    this.view.setLoading(true);
    this.authRepo.resetPassword({ token, password, passwordConfirmation: confirm }).subscribe({
      next: () => {
        this.view.setLoading(false);
        this.toast.success('Kata sandi berhasil diatur ulang.');
        this.view.navigateToLogin();
      },
      error: () => this.view.setLoading(false),
    });
  }
}
