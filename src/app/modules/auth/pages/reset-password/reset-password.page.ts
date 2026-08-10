import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PasswordFieldComponent } from '../../../../shared/password-field.component';
import { ResetPasswordPresenter } from './reset-password.presenter';
import { ResetPasswordView } from './reset-password.view';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  templateUrl: './reset-password.page.html',
  imports: [FormsModule, RouterLink, PasswordFieldComponent],
  providers: [ResetPasswordPresenter],
  styles: [`
    h2 { margin-bottom: 4px; } .subtitle { color: var(--color-text-secondary); margin: 0 0 24px; }
    .notice-error { background: var(--color-danger-soft); color: var(--color-danger); padding: 16px; border-radius: 12px; font-size: .9rem; }
    .foot { text-align: center; margin-top: 24px; font-size: .9rem; }
  `],
})
export class ResetPasswordPage implements OnInit, ResetPasswordView {
  private presenter = inject(ResetPasswordPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = '';
  password = '';
  confirm = '';
  loading = signal(false);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  submit(): void { this.presenter.submit(this.token, this.password, this.confirm); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  navigateToLogin(): void { this.router.navigate(['/login']); }
}
