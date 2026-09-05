import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SubscriptionRepository } from '../modules/subscription/repositories/subscription.repository';
import { ToastService } from '../core/services/toast.service';
import { IconComponent } from './icon.component';

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
    <form class="newsletter-form" (ngSubmit)="submit()">
      <input
        type="email"
        class="form-control"
        name="newsletterEmail"
        [(ngModel)]="email"
        [disabled]="loading()"
        placeholder="Alamat email Anda"
        required
      >
      <button type="submit" class="btn btn-primary" [disabled]="loading()">
        @if (loading()) { <span class="spinner spinner-sm"></span> } @else { <app-icon name="send" [size]="14" /> Berlangganan }
      </button>
    </form>
  `,
  styles: [`
    :host { display: contents; }
    .newsletter-form { display: flex; gap: 8px; flex-wrap: wrap; }
    .newsletter-form .form-control { flex: 1; min-width: 200px; }
    .newsletter-form .btn { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
  `],
})
export class NewsletterFormComponent {
  private repo = inject(SubscriptionRepository);
  private toast = inject(ToastService);

  email = '';
  loading = signal(false);

  submit(): void {
    const email = this.email.trim();
    if (!email) return;

    this.loading.set(true);
    this.repo.subscribe(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.email = '';
        this.toast.success('Terima kasih! Silakan cek email Anda untuk konfirmasi berlangganan.');
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Gagal berlangganan. Silakan coba lagi.');
      },
    });
  }
}
