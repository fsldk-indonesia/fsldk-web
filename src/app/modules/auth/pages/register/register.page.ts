import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GoogleButtonComponent } from '../../../../shared/google-button.component';
import { PasswordFieldComponent } from '../../../../shared/password-field.component';
import { environment } from '../../../../../environments/environment';
import { RegisterPresenter } from './register.presenter';
import { RegisterView } from './register.view';

@Component({
  selector: 'app-register-page',
  standalone: true,
  templateUrl: './register.page.html',
  imports: [FormsModule, RouterLink, GoogleButtonComponent, PasswordFieldComponent],
  providers: [RegisterPresenter],
  styles: [`
    h2 { margin-bottom: 4px; } .subtitle { color: var(--color-text-secondary); margin: 0 0 24px; }
    .foot { text-align: center; margin-top: 24px; color: var(--color-text-secondary); font-size: .9rem; }
    .divider { text-align: center; margin: 22px 0; position: relative; color: var(--color-muted); font-size: .85rem; }
    .divider::before { content:''; position:absolute; top:50%; left:0; right:0; height:1px; background: var(--color-border); }
    .divider span { background: var(--color-bg-warm); padding: 0 12px; position: relative; }
    .btn-google { display: flex; align-items: center; justify-content: center; gap: 10px; }
    .g-icon { flex-shrink: 0; }
  `],
})
export class RegisterPage implements OnInit, RegisterView {
  private presenter = inject(RegisterPresenter);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  fullName = '';
  email = '';
  password = '';
  confirm = '';
  loading = signal(false);
  googleEnabled = !!environment.googleClientId;

  ngOnInit(): void { this.presenter.attachView(this); }

  submit(): void { this.presenter.submit(this.fullName, this.email, this.password, this.confirm); }
  google(idToken?: string): void { this.presenter.registerGoogle(idToken); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  navigateToVerifyEmail(email: string): void { this.router.navigate(['/verifikasi-email'], { queryParams: { email } }); }
  navigateAfterLogin(hasCmsAccess: boolean): void {
    if (hasCmsAccess) { this.router.navigate(['/cms/dashboard']); return; }
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.router.navigateByUrl(returnUrl || '/');
  }
}
