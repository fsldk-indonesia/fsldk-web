import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { GoogleButtonComponent } from '../../shared/google-button.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, GoogleButtonComponent],
  template: `
    <h2>Daftar Akun</h2>
    <p class="subtitle">Bergabung dan ikut menggerakkan dakwah kampus.</p>

    <form (ngSubmit)="submit()">
      <div class="form-group">
        <label class="form-label">Nama Lengkap</label>
        <input class="form-control" name="fullName" [(ngModel)]="fullName" placeholder="Nama lengkap Anda" required>
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-control" type="email" name="email" [(ngModel)]="email" placeholder="nama@email.com" required>
      </div>
      <div class="form-group">
        <label class="form-label">Kata Sandi</label>
        <input class="form-control" type="password" name="password" [(ngModel)]="password" placeholder="Minimal 8 karakter" required>
      </div>
      <div class="form-group">
        <label class="form-label">Konfirmasi Kata Sandi</label>
        <input class="form-control" type="password" name="confirm" [(ngModel)]="confirm" placeholder="Ulangi kata sandi" required>
      </div>
      <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
        @if (loading()) { <span class="spinner"></span> } @else { Daftar }
      </button>
    </form>

    <div class="divider"><span>atau</span></div>
    @if (googleEnabled) {
      <app-google-button text="signup_with" (credential)="google($event)" />
    } @else {
      <button class="btn btn-google" type="button" (click)="google()">
        <span class="g">G</span> Daftar dengan Google
      </button>
    }

    <p class="foot">Sudah punya akun? <a routerLink="/login">Masuk di sini</a></p>
  `,
  styles: [`
    h2 { margin-bottom: 4px; } .subtitle { color: var(--color-text-secondary); margin: 0 0 24px; }
    .foot { text-align: center; margin-top: 24px; color: var(--color-text-secondary); font-size: .9rem; }
    .divider { text-align: center; margin: 22px 0; position: relative; color: var(--color-muted); font-size: .85rem; }
    .divider::before { content:''; position:absolute; top:50%; left:0; right:0; height:1px; background: var(--color-border); }
    .divider span { background: var(--color-bg-warm); padding: 0 12px; position: relative; }
    .g { font-family: var(--font-heading); font-weight: 800; color: #4285F4; }
  `],
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  fullName = '';
  email = '';
  password = '';
  confirm = '';
  loading = signal(false);
  googleEnabled = !!environment.googleClientId;

  google(idToken?: string): void {
    if (!idToken) {
      this.toast.info('Daftar dengan Google memerlukan konfigurasi Google Client ID pada environment.');
      return;
    }
    this.loading.set(true);
    this.auth.loginGoogle(idToken).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success('Selamat datang, ' + res.user.fullName);
        this.router.navigate([res.user.emailVerified ? '/cms/dashboard' : '/verifikasi-email']);
      },
      error: () => this.loading.set(false),
    });
  }

  submit(): void {
    if (this.password !== this.confirm) { this.toast.error('Konfirmasi kata sandi tidak cocok'); return; }
    if (this.password.length < 8) { this.toast.error('Kata sandi minimal 8 karakter'); return; }
    this.loading.set(true);
    this.auth.register({ fullName: this.fullName, email: this.email, password: this.password, passwordConfirmation: this.confirm }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Registrasi berhasil! Silakan cek email untuk verifikasi.');
        this.router.navigate(['/verifikasi-email'], { queryParams: { email: this.email } });
      },
      error: () => this.loading.set(false),
    });
  }
}
