import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SubscriptionRepository } from '../modules/subscription/repositories/subscription.repository';
import { ToastService } from '../core/services/toast.service';
import { IconComponent } from './icon.component';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Form berlangganan newsletter ringkas (email + tombol) — dipakai di footer
 * landing page dan halaman Hubungi Kami. Mandiri (baca SubscriptionRepository
 * sendiri) supaya bisa dipasang di halaman manapun tanpa wiring tambahan.
 */
@Component({
  selector: 'app-newsletter-form',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <form class="newsletter-form" (ngSubmit)="submit()" novalidate>
      <div class="newsletter-field">
        <input
          type="email"
          class="form-control"
          [class.is-invalid]="error()"
          name="newsletterEmail"
          [(ngModel)]="email"
          (ngModelChange)="error.set(null)"
          [disabled]="loading()"
          placeholder="Alamat email Anda"
          required
        >
        @if (error()) {
          <div class="form-error">{{ error() }}</div>
        }
      </div>
      <button type="submit" class="btn btn-primary" [disabled]="loading()">
        @if (loading()) { <span class="spinner spinner-sm"></span> } @else { <app-icon name="send" [size]="14" /> Berlangganan }
      </button>
    </form>
  `,
  styles: [`
    :host { display: contents; }
    .newsletter-form { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-start; }
    .newsletter-field { flex: 1; min-width: 200px; }
    /* border-radius disamakan dengan tombol "Lihat Semua" (var(--radius-sm))
       — sebelumnya lebih bulat (pil) daripada elemen form lain di beranda. */
    .newsletter-field .form-control { width: 100%; border-radius: var(--radius-sm); }
    .newsletter-field .form-control.is-invalid { border-color: var(--color-danger); }
    .newsletter-field .form-error { color: var(--color-danger); font-size: .78rem; margin-top: 5px; font-weight: 500; }
    .newsletter-form .btn { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; border-radius: var(--radius-sm); }
  `],
})
export class NewsletterFormComponent {
  private repo = inject(SubscriptionRepository);
  private toast = inject(ToastService);

  email = '';
  loading = signal(false);
  error = signal<string | null>(null);

  submit(): void {
    const email = this.email.trim();
    if (!email) {
      this.error.set('Alamat email wajib diisi.');
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      this.error.set('Alamat email tidak valid.');
      return;
    }

    this.loading.set(true);
    this.repo.subscribe(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.email = '';
        this.toast.success('Terima kasih! Silakan cek email Anda untuk konfirmasi berlangganan.');
      },
      error: (err) => {
        this.loading.set(false);
        const fieldMessages = Array.isArray(err.error?.errors)
          ? (err.error.errors as { message?: string }[]).map((e) => e.message).filter(Boolean).join(', ')
          : '';
        this.error.set(fieldMessages || err.error?.message || 'Gagal berlangganan. Silakan coba lagi.');
      },
    });
  }
}
