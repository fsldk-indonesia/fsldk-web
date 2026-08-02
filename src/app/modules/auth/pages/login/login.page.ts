import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GoogleButtonComponent } from '../../../../shared/google-button.component';
import { environment } from '../../../../../environments/environment';
import { LoginPresenter } from './login.presenter';
import { LoginView } from './login.view';

@Component({
  selector: 'app-login-page',
  standalone: true,
  templateUrl: './login.page.html',
  imports: [FormsModule, RouterLink, GoogleButtonComponent],
  providers: [LoginPresenter],
  styles: [`
    h2 { margin-bottom: 4px; } .subtitle { color: var(--color-text-secondary); margin: 0 0 24px; }
    .remember { display: flex; align-items: center; gap: 8px; font-size: .88rem; color: var(--color-text-secondary); }
    .divider { text-align: center; margin: 22px 0; position: relative; color: var(--color-muted); font-size: .85rem; }
    .divider::before { content:''; position:absolute; top:50%; left:0; right:0; height:1px; background: var(--color-border); }
    .divider span { background: var(--color-bg-warm); padding: 0 12px; position: relative; }
    .btn-google { display: flex; align-items: center; justify-content: center; gap: 10px; }
    .g-icon { flex-shrink: 0; }
    .foot { text-align: center; margin-top: 24px; color: var(--color-text-secondary); font-size: .9rem; }
  `],
})
export class LoginPage implements OnInit, LoginView {
  private presenter = inject(LoginPresenter);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  remember = true;
  loading = signal(false);
  googleEnabled = !!environment.googleClientId;

  ngOnInit(): void { this.presenter.attachView(this); }

  submit(): void { this.presenter.submit(this.email, this.password); }
  google(idToken?: string): void { this.presenter.loginGoogle(idToken); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  navigateToVerifyEmail(): void { this.router.navigate(['/verifikasi-email']); }
  navigateAfterLogin(hasCmsAccess: boolean): void {
    if (hasCmsAccess) { this.router.navigate(['/cms/dashboard']); return; }
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.router.navigateByUrl(returnUrl || '/');
  }
}
