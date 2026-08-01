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
    h2 { margin-bottom: 4px; } .subtitle { color: var(--color-text-secondary); margin: 0 0 24px; }
    .notice { background: var(--color-primary-soft); color: var(--color-primary-dark); padding: 16px; border-radius: 12px; font-size: .9rem; }
    .foot { text-align: center; margin-top: 24px; font-size: .9rem; }
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
