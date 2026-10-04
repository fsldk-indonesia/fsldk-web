import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ForgotPasswordPresenter } from './forgot-password.presenter';
import { ForgotPasswordView } from './forgot-password.view';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  templateUrl: './forgot-password.page.html',
  imports: [FormsModule, RouterLink],
  providers: [ForgotPasswordPresenter],
  styles: [`
    h2 { margin: 0 0 3px; font-size: 1.3rem; } .subtitle { color: var(--color-text-secondary); margin: 0 0 14px; font-size: .88rem; }
    .form-group { margin-bottom: 12px; }
    .form-control { padding: 9px 12px; }
    .btn-block { padding: 10px 22px; }
    .notice { background: var(--color-primary-soft); color: var(--color-primary-dark); padding: 14px; border-radius: 12px; font-size: .88rem; }
    .foot { text-align: center; margin-top: 14px; font-size: .86rem; }
  `],
})
export class ForgotPasswordPage implements ForgotPasswordView {
  private presenter = inject(ForgotPasswordPresenter);
  email = '';
  loading = signal(false);
  sent = signal(false);

  constructor() { this.presenter.attachView(this); }

  submit(): void { this.presenter.submit(this.email); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setSent(sent: boolean): void { this.sent.set(sent); }
}
