import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ForgotPasswordView } from './forgot-password.view';

@Injectable()
export class ForgotPasswordPresenter extends BasePresenter<ForgotPasswordView> {
  private authRepo = inject(AuthRepository);

  submit(email: string): void {
    this.view.setLoading(true);
    this.authRepo.forgotPassword(email).subscribe({
      next: () => { this.view.setLoading(false); this.view.setSent(true); },
      error: () => this.view.setLoading(false),
    });
  }
}
