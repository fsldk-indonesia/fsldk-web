import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
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

    <p class="foot">Sudah punya akun? <a routerLink="/login">Masuk di sini</a></p>
  `,
  styles: [`
    h2 { margin-bottom: 4px; } .subtitle { color: var(--color-text-secondary); margin: 0 0 24px; }
    .foot { text-align: center; margin-top: 24px; color: var(--color-text-secondary); font-size: .9rem; }
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
