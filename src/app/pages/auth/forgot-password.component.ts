import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <h2>Lupa Kata Sandi</h2>
    <p class="subtitle">Masukkan email Anda, kami akan mengirim tautan untuk mengatur ulang kata sandi.</p>
    @if (sent()) {
      <div class="notice">Jika email terdaftar, tautan reset telah dikirim. Silakan cek kotak masuk Anda.</div>
    } @else {
      <form (ngSubmit)="submit()">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-control" type="email" name="email" [(ngModel)]="email" placeholder="nama@email.com" required>
        </div>
        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> } @else { Kirim Tautan Reset }
        </button>
      </form>
    }
    <p class="foot"><a routerLink="/login">Kembali ke Login</a></p>
  `,
  styles: [`
    h2 { margin-bottom: 4px; } .subtitle { color: var(--color-text-secondary); margin: 0 0 24px; }
    .notice { background: var(--color-primary-soft); color: var(--color-primary-dark); padding: 16px; border-radius: 12px; font-size: .9rem; }
    .foot { text-align: center; margin-top: 24px; font-size: .9rem; }
  `],
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  email = '';
  loading = signal(false);
  sent = signal(false);

  submit(): void {
    this.loading.set(true);
    this.auth.forgotPassword(this.email).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: () => this.loading.set(false),
    });
  }
}
