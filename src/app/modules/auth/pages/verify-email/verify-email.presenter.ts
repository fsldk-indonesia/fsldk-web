import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { VerifyEmailView } from './verify-email.view';

@Injectable()
export class VerifyEmailPresenter extends BasePresenter<VerifyEmailView> {
  private authRepo = inject(AuthRepository);
  private toast = inject(ToastService);

  verify(token: string | null): void {
    if (!token) return;
    this.view.setVerifying(true);
    this.authRepo.verifyEmail(token).subscribe({
      next: () => {
        this.view.setVerifying(false);
        this.view.setVerified(true);
        if (this.authRepo.isLoggedIn()) this.authRepo.refreshMe().subscribe();
      },
      error: () => {
        this.view.setVerifying(false);
        this.view.showInvalidTokenError();
      },
    });
  }

  resend(): void {
    this.view.setResendLoading(true);
    this.authRepo.resendVerification().subscribe({
      next: () => { this.view.setResendLoading(false); this.toast.success('Email verifikasi telah dikirim ulang.'); },
      error: () => this.view.setResendLoading(false),
    });
  }
}
