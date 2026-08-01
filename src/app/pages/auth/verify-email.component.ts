import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (verifying()) {
      <div class="center"><span class="spinner spinner-dark"></span><p>Memverifikasi email…</p></div>
    } @else if (verified()) {
      <div class="icon ok">&#10003;</div>
      <h2>Email Terverifikasi</h2>
      <p class="subtitle">Akun Anda telah aktif. Silakan masuk untuk mulai menggunakan CMS.</p>
      <a routerLink="/login" class="btn btn-primary btn-block">Lanjut ke Login</a>
    } @else {
      <div class="icon wait">&#9993;</div>
      <h2>Verifikasi Email Anda</h2>
      <p class="subtitle">Kami telah mengirim tautan verifikasi ke email Anda. Silakan buka email dan klik tautan tersebut untuk mengaktifkan akun.</p>
      @if (auth.isLoggedIn()) {
        <button class="btn btn-primary btn-block" (click)="resend()" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> } @else { Kirim Ulang Email Verifikasi }
        </button>
      }
      <p class="foot"><a routerLink="/login">Kembali ke Login</a></p>
    }
  `,
  styles: [`
    .center { text-align: center; padding: 40px 0; }
    .icon { width: 72px; height: 72px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 20px; }
    .icon.ok { background: var(--color-primary-soft); color: var(--color-primary); }
    .icon.wait { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    h2 { text-align: center; } .subtitle { text-align: center; color: var(--color-text-secondary); margin: 0 0 24px; }
    .foot { text-align: center; margin-top: 20px; font-size: .9rem; }
  `],
})
export class VerifyEmailComponent implements OnInit {
  auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  verifying = signal(false);
  verified = signal(false);
  loading = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.verifying.set(true);
      this.auth.verifyEmail(token).subscribe({
        next: () => {
          this.verifying.set(false);
          this.verified.set(true);
          if (this.auth.isLoggedIn()) this.auth.refreshMe().subscribe();
        },
        error: () => {
          this.verifying.set(false);
          this.toast.error('Tautan verifikasi tidak valid atau kedaluwarsa.');
        },
      });
    }
  }

  resend(): void {
    this.loading.set(true);
    this.auth.resendVerification().subscribe({
      next: () => { this.loading.set(false); this.toast.success('Email verifikasi telah dikirim ulang.'); },
      error: () => this.loading.set(false),
    });
  }
}
