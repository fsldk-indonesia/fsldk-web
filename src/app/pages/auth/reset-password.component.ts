import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <h2>Atur Ulang Kata Sandi</h2>
    <p class="subtitle">Masukkan kata sandi baru untuk akun Anda.</p>
    @if (!token) {
      <div class="notice-error">Tautan tidak valid. Silakan minta tautan reset kembali.</div>
      <a routerLink="/lupa-password" class="btn btn-primary btn-block mt">Minta Tautan Baru</a>
    } @else {
      <form (ngSubmit)="submit()">
        <div class="form-group"><label class="form-label">Kata Sandi Baru</label>
          <input class="form-control" type="password" name="pw" [(ngModel)]="password" placeholder="Minimal 8 karakter" required></div>
        <div class="form-group"><label class="form-label">Konfirmasi Kata Sandi</label>
          <input class="form-control" type="password" name="cf" [(ngModel)]="confirm" placeholder="Ulangi kata sandi" required></div>
        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> } @else { Simpan Kata Sandi }
        </button>
      </form>
    }
    <p class="foot"><a routerLink="/login">Kembali ke Login</a></p>
  `,
  styles: [`
    h2 { margin-bottom: 4px; } .subtitle { color: var(--color-text-secondary); margin: 0 0 24px; }
    .notice-error { background: var(--color-danger-soft); color: var(--color-danger); padding: 16px; border-radius: 12px; font-size: .9rem; }
    .foot { text-align: center; margin-top: 24px; font-size: .9rem; }
  `],
})
export class ResetPasswordComponent implements OnInit {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  token = '';
  password = '';
  confirm = '';
  loading = signal(false);

  ngOnInit(): void { this.token = this.route.snapshot.queryParamMap.get('token') ?? ''; }

  submit(): void {
    if (this.password !== this.confirm) { this.toast.error('Konfirmasi kata sandi tidak cocok'); return; }
    if (this.password.length < 8) { this.toast.error('Kata sandi minimal 8 karakter'); return; }
    this.loading.set(true);
    this.auth.resetPassword({ token: this.token, password: this.password, passwordConfirmation: this.confirm }).subscribe({
      next: () => { this.loading.set(false); this.toast.success('Kata sandi berhasil diatur ulang.'); this.router.navigate(['/login']); },
      error: () => this.loading.set(false),
    });
  }
}
