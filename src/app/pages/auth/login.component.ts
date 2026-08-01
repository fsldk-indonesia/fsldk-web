import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <h2>Masuk ke Akun</h2>
    <p class="subtitle">Silakan masuk untuk melanjutkan.</p>

    <form (ngSubmit)="submit()">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-control" type="email" name="email" [(ngModel)]="email" placeholder="nama@email.com" required>
      </div>
      <div class="form-group">
        <label class="form-label">Kata Sandi</label>
        <input class="form-control" type="password" name="password" [(ngModel)]="password" placeholder="••••••••" required>
      </div>
      <div class="flex justify-between items-center" style="margin-bottom:18px">
        <label class="remember"><input type="checkbox" name="remember" [(ngModel)]="remember"> Ingat saya</label>
        <a routerLink="/lupa-password">Lupa kata sandi?</a>
      </div>
      <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
        @if (loading()) { <span class="spinner"></span> } @else { Masuk }
      </button>
    </form>

    <div class="divider"><span>atau</span></div>
    <button class="btn btn-google" type="button" (click)="google()">
      <span class="g">G</span> Masuk dengan Google
    </button>

    <p class="foot">Belum punya akun? <a routerLink="/daftar">Daftar sekarang</a></p>
  `,
  styles: [`
    h2 { margin-bottom: 4px; } .subtitle { color: var(--color-text-secondary); margin: 0 0 24px; }
    .remember { display: flex; align-items: center; gap: 8px; font-size: .88rem; color: var(--color-text-secondary); }
    .divider { text-align: center; margin: 22px 0; position: relative; color: var(--color-muted); font-size: .85rem; }
    .divider::before { content:''; position:absolute; top:50%; left:0; right:0; height:1px; background: var(--color-border); }
    .divider span { background: var(--color-bg-warm); padding: 0 12px; position: relative; }
    .g { font-family: var(--font-heading); font-weight: 800; color: #4285F4; }
    .foot { text-align: center; margin-top: 24px; color: var(--color-text-secondary); font-size: .9rem; }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  email = '';
  password = '';
  remember = true;
  loading = signal(false);

  submit(): void {
    if (!this.email || !this.password) { this.toast.error('Email dan kata sandi wajib diisi'); return; }
    this.loading.set(true);
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success('Selamat datang, ' + res.user.fullName);
        this.router.navigate([res.user.emailVerified ? '/cms/dashboard' : '/verifikasi-email']);
      },
      error: () => this.loading.set(false),
    });
  }

  google(): void {
    // Integrasi penuh Google Identity Services memerlukan Client ID terkonfigurasi.
    this.toast.info('Login Google memerlukan konfigurasi Google Client ID pada environment.');
  }
}
