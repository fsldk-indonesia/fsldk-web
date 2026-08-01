import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { VerifyEmailPresenter } from './verify-email.presenter';
import { VerifyEmailView } from './verify-email.view';

@Component({
  selector: 'app-verify-email-page',
  standalone: true,
  templateUrl: './verify-email.page.html',
  imports: [RouterLink],
  providers: [VerifyEmailPresenter],
  styles: [`
    .center { text-align: center; padding: 40px 0; }
    .icon { width: 72px; height: 72px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 20px; }
    .icon.ok { background: var(--color-primary-soft); color: var(--color-primary); }
    .icon.wait { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    h2 { text-align: center; } .subtitle { text-align: center; color: var(--color-text-secondary); margin: 0 0 24px; }
    .foot { text-align: center; margin-top: 20px; font-size: .9rem; }
  `],
})
export class VerifyEmailPage implements OnInit, VerifyEmailView {
  private presenter = inject(VerifyEmailPresenter);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private authRepo = inject(AuthRepository);

  verifying = signal(false);
  verified = signal(false);
  resendLoading = signal(false);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.verify(this.route.snapshot.queryParamMap.get('token'));
  }

  isLoggedIn(): boolean { return this.authRepo.isLoggedIn(); }
  resend(): void { this.presenter.resend(); }

  setVerifying(verifying: boolean): void { this.verifying.set(verifying); }
  setVerified(verified: boolean): void { this.verified.set(verified); }
  setResendLoading(loading: boolean): void { this.resendLoading.set(loading); }
  showInvalidTokenError(): void { this.toast.error('Tautan verifikasi tidak valid atau kedaluwarsa.'); }
}
