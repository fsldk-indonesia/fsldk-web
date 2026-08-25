import { Component, OnInit, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toDataURL } from 'qrcode';
import { Donation, DonationStatus } from '../../entities/donation';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalPaymentStatusPresenter } from './kantong-amal.payment-status.presenter';
import { KantongAmalPaymentStatusView } from './kantong-amal.payment-status.view';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;
const TERMINAL_STATUSES: DonationStatus[] = ['PAID', 'EXPIRED', 'FAILED', 'CANCELLED', 'REFUNDED', 'AMOUNT_MISMATCH'];

@Component({
  selector: 'app-kantong-amal-payment-status-page',
  standalone: true,
  templateUrl: './kantong-amal.payment-status.page.html',
  imports: [RouterLink],
  providers: [KantongAmalPaymentStatusPresenter],
  styles: [`
    .status-card { max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 32px; text-align: center; }
    .qr-box { width: 240px; height: 240px; margin: 0 auto 20px; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .qr-box img { width: 100%; height: 100%; object-fit: contain; }
    .amount { font-size: 1.6rem; font-weight: 800; color: var(--color-primary-dark); margin: 10px 0; }
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 999px; font-size: .82rem; font-weight: 700; margin-bottom: 16px; }
    .status-pending { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-failed { background: #fee2e2; color: #991b1b; }
  `],
})
export class KantongAmalPaymentStatusPage implements OnInit, OnDestroy, KantongAmalPaymentStatusView {
  private presenter = inject(KantongAmalPaymentStatusPresenter);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  donation = signal<Donation | null>(null);
  loading = signal(true);
  timedOut = signal(false);
  qrImageDataUrl = signal<string | null>(null);

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;

  private publicRef = '';
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private pollStart = 0;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.publicRef = this.route.snapshot.paramMap.get('publicRef')!;
    this.presenter.loadDetail(this.publicRef);
  }

  ngOnDestroy(): void { this.stopPolling(); }

  private startPolling(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.pollStart = Date.now();
    this.pollTimer = setInterval(() => this.tick(), POLL_INTERVAL_MS);
  }

  private tick(): void {
    if (Date.now() - this.pollStart > POLL_TIMEOUT_MS) {
      this.stopPolling();
      this.timedOut.set(true);
      return;
    }
    this.presenter.checkStatus(this.publicRef, (status) => {
      const current = this.donation();
      if (!current) return;
      this.donation.set({ ...current, paymentStatus: status });
      if (TERMINAL_STATUSES.includes(status)) this.stopPolling();
    });
  }

  private stopPolling(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  }

  statusClass(): string {
    const s = this.donation()?.paymentStatus;
    if (s === 'PAID') return 'status-paid';
    if (s === 'PENDING') return 'status-pending';
    return 'status-failed';
  }

  statusLabel(): string {
    switch (this.donation()?.paymentStatus) {
      case 'PENDING': return 'Menunggu Pembayaran';
      case 'PAID': return 'Pembayaran Berhasil';
      case 'EXPIRED': return 'Kedaluwarsa';
      case 'FAILED': return 'Gagal';
      case 'CANCELLED': return 'Dibatalkan';
      case 'REFUNDED': return 'Dikembalikan';
      case 'AMOUNT_MISMATCH': return 'Perlu Verifikasi Manual';
      default: return '';
    }
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setDonation(donation: Donation | null): void {
    this.donation.set(donation);
    if (donation && donation.paymentStatus === 'PENDING') {
      this.startPolling();
      // qrPayload adalah string EMVCo QRIS mentah (bukan gambar) — dirender
      // jadi QR code scannable di sisi client, bukan diikat langsung ke <img src>.
      if (donation.qrPayload && isPlatformBrowser(this.platformId)) {
        toDataURL(donation.qrPayload, { width: 480, margin: 1 })
          .then((url) => this.qrImageDataUrl.set(url))
          .catch(() => this.qrImageDataUrl.set(null));
      }
    }
  }
}
