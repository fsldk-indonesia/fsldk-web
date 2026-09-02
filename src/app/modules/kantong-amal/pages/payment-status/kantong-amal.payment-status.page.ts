import { Component, OnInit, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toDataURL } from 'qrcode';
import { Donation, DonationStatus } from '../../entities/donation';
import { IconComponent } from '../../../../shared/icon.component';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalPaymentStatusPresenter } from './kantong-amal.payment-status.presenter';
import { KantongAmalPaymentStatusView } from './kantong-amal.payment-status.view';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;
const TERMINAL_STATUSES: DonationStatus[] = ['PAID', 'EXPIRED', 'FAILED', 'CANCELLED', 'REFUNDED', 'AMOUNT_MISMATCH'];

/** Warna brand FSLDK (sinkron dengan --color-primary/--color-primary-dark di
 *  styles.scss) — dipakai langsung sebagai hex di sini karena canvas 2D tidak
 *  bisa membaca CSS custom property secara otomatis. */
const BRAND_GREEN = '#00933b';
const BRAND_GREEN_DARK = '#046428';

@Component({
  selector: 'app-kantong-amal-payment-status-page',
  standalone: true,
  templateUrl: './kantong-amal.payment-status.page.html',
  imports: [RouterLink, DatePipe, IconComponent],
  providers: [KantongAmalPaymentStatusPresenter],
  styles: [`
    .status-card { max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 32px; text-align: center; }

    .status-icon { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .status-icon.status-pending { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .status-icon.status-paid { background: #dcfce7; color: #166534; }
    .status-icon.status-failed { background: #fee2e2; color: #991b1b; }
    .status-title { font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; margin: 0 0 6px; }
    .status-sub { color: var(--color-text-secondary); font-size: .92rem; margin: 0; }

    .polling-indicator { display: inline-flex; align-items: center; gap: 8px; margin-top: 14px; padding: 6px 14px; border-radius: var(--radius-full); background: var(--color-bg-alt); font-size: .8rem; color: var(--color-text-secondary); }
    .polling-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-primary); flex-shrink: 0; animation: node-pulse 1.4s ease-in-out infinite; }

    /* ── QRIS card ────────────────────────────────────────── */
    .qris-card { margin-top: 22px; padding-top: 22px; border-top: 1px solid var(--color-border); }
    .qris-provider { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 14px; padding: 5px 14px; border-radius: var(--radius-full); background: var(--color-bg-alt); border: 1px solid var(--color-border); font-size: .74rem; color: var(--color-text-secondary); }
    .qris-provider strong { color: var(--color-text); }
    .qr-box { width: 240px; height: 240px; margin: 0 auto 16px; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .qr-box img { width: 100%; height: 100%; object-fit: contain; }
    .amount { font-size: 1.6rem; font-weight: 800; color: var(--color-primary-dark); margin: 4px 0 10px; }
    .qris-expiry { font-size: .82rem; color: var(--color-muted); margin-top: 10px; }
    .qris-dl-btn { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; }

    /* ── Detail pembayaran ────────────────────────────────── */
    .detail-card { margin-top: 22px; padding-top: 22px; border-top: 1px solid var(--color-border); text-align: left; }
    .detail-title { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-size: .95rem; font-weight: 700; margin: 0 0 14px; color: var(--color-text); }
    .detail-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 7px 0; font-size: .88rem; }
    .detail-row + .detail-row { border-top: 1px dashed var(--color-border); }
    .detail-key { color: var(--color-text-secondary); }
    .detail-val { color: var(--color-text); font-weight: 600; text-align: right; }
    .detail-row.total .detail-key, .detail-row.total .detail-val { font-weight: 800; color: var(--color-text); font-size: .95rem; }

    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 999px; font-size: .82rem; font-weight: 700; margin-bottom: 16px; }
    .status-badge.status-pending { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .status-badge.status-paid { background: #dcfce7; color: #166534; }
    .status-badge.status-failed { background: #fee2e2; color: #991b1b; }
  `],
})
export class KantongAmalPaymentStatusPage implements OnInit, OnDestroy, KantongAmalPaymentStatusView {
  private presenter = inject(KantongAmalPaymentStatusPresenter);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  donation = signal<Donation | null>(null);
  loading = signal(true);
  timedOut = signal(false);
  checkingManually = signal(false);
  qrImageDataUrl = signal<string | null>(null);
  downloadingQr = signal(false);

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
    this.presenter.checkStatus(this.publicRef, (status) => this.applyStatus(status));
  }

  private stopPolling(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  }

  private applyStatus(status: DonationStatus): void {
    const current = this.donation();
    if (!current) return;
    this.donation.set({ ...current, paymentStatus: status });
    if (TERMINAL_STATUSES.includes(status)) this.stopPolling();
  }

  /** Tombol "Cek Status Manual" setelah polling otomatis timeout (10 menit) —
   *  sebelumnya tombol ini kosong (hanya preventDefault, tidak melakukan
   *  apa-apa sama sekali). Sekarang benar-benar memeriksa status sekali, dan
   *  melanjutkan polling otomatis lagi bila hasilnya masih PENDING. */
  manualCheck(): void {
    if (this.checkingManually()) return;
    this.checkingManually.set(true);
    this.presenter.checkStatus(this.publicRef, (status) => {
      this.checkingManually.set(false);
      this.applyStatus(status);
      if (status === 'PENDING') {
        this.timedOut.set(false);
        this.startPolling();
      }
    });
  }

  statusClass(): string {
    const s = this.donation()?.paymentStatus;
    if (s === 'PAID') return 'status-paid';
    if (s === 'PENDING') return 'status-pending';
    return 'status-failed';
  }

  statusIcon(): string {
    switch (this.donation()?.paymentStatus) {
      case 'PAID': return 'check-circle';
      case 'PENDING': return 'clock';
      case 'AMOUNT_MISMATCH': return 'alert-triangle';
      default: return 'x-circle';
    }
  }

  statusLabel(): string {
    switch (this.donation()?.paymentStatus) {
      case 'PENDING': return 'Menunggu Pembayaran';
      case 'PAID': return 'Pembayaran Berhasil';
      case 'EXPIRED': return 'QRIS Kedaluwarsa';
      case 'FAILED': return 'Pembayaran Gagal';
      case 'CANCELLED': return 'Dibatalkan';
      case 'REFUNDED': return 'Dikembalikan';
      case 'AMOUNT_MISMATCH': return 'Perlu Verifikasi Manual';
      default: return '';
    }
  }

  statusSubtitle(): string {
    switch (this.donation()?.paymentStatus) {
      case 'PENDING': return 'Silakan selesaikan proses pembayaran Anda.';
      case 'PAID': return 'Jazakumullah khayran, donasi Anda sudah kami terima!';
      case 'EXPIRED': return 'Waktu pembayaran telah habis. Silakan donasi kembali.';
      case 'FAILED': return 'Terjadi masalah pada pembayaran. Silakan coba lagi.';
      case 'CANCELLED': return 'Pembayaran dibatalkan. Silakan donasi kembali bila berkenan.';
      case 'AMOUNT_MISMATCH': return 'Nominal yang diterima tidak sesuai. Tim kami akan menghubungi Anda.';
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

  /** Unduh kartu QR bermerek FSLDK (QR + nominal + campaign + atribusi
   *  Amdigipay) sebagai PNG — setara "Download QR Code" di ldksyahid-app,
   *  disederhanakan & memakai identitas visual FSLDK sendiri (bukan
   *  meniru brand ldksyahid-app). */
  async downloadQr(): Promise<void> {
    const qr = this.qrImageDataUrl();
    const donation = this.donation();
    if (!qr || !donation || !isPlatformBrowser(this.platformId) || this.downloadingQr()) return;

    this.downloadingQr.set(true);
    try {
      const dataUrl = await this.buildBrandedQrCard(qr, donation);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `qris-donasi-fsldk-${this.timestampForFilename()}.png`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      this.downloadingQr.set(false);
    }
  }

  private buildBrandedQrCard(qrDataUrl: string, donation: Donation): Promise<string> {
    const W = 480;
    const H = 680;
    const DPR = 2;

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(DPR, DPR);

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Header
      const headerH = 96;
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, BRAND_GREEN);
      grad.addColorStop(1, BRAND_GREEN_DARK);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, headerH);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
      ctx.fillText('FSLDK Indonesia', W / 2, headerH / 2 - 4);
      ctx.font = '13px "Segoe UI", Arial, sans-serif';
      ctx.fillText('Kantong Amal — Donasi QRIS', W / 2, headerH / 2 + 18);

      // QR card
      const qrDisplay = 260;
      const cardPad = 20;
      const cardSize = qrDisplay + cardPad * 2;
      const cardX = (W - cardSize) / 2;
      const cardY = headerH + 32;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.12)';
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#ffffff';
      this.roundRectPath(ctx, cardX, cardY, cardSize, cardSize, 18);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#e6ebe3';
      ctx.lineWidth = 1.5;
      this.roundRectPath(ctx, cardX, cardY, cardSize, cardSize, 18);
      ctx.stroke();

      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, cardX + cardPad, cardY + cardPad, qrDisplay, qrDisplay);

        let y = cardY + cardSize + 42;
        ctx.fillStyle = BRAND_GREEN_DARK;
        ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
        ctx.fillText(formatRupiah(donation.totalAmount), W / 2, y);

        y += 30;
        ctx.fillStyle = '#44534b';
        ctx.font = '13px "Segoe UI", Arial, sans-serif';
        y = this.wrapText(ctx, donation.campaignTitle, W / 2, y, W - 80, 20);

        if (donation.expiredDate) {
          y += 14;
          ctx.fillStyle = '#71807a';
          ctx.font = '12px "Segoe UI", Arial, sans-serif';
          ctx.fillText('Berlaku sampai ' + this.formatExpiryForCanvas(donation.expiredDate), W / 2, y);
        }

        ctx.strokeStyle = '#f2f4ef';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, H - 44);
        ctx.lineTo(W - 40, H - 44);
        ctx.stroke();

        ctx.fillStyle = '#71807a';
        ctx.font = '11px "Segoe UI", Arial, sans-serif';
        ctx.fillText('Diproses oleh Amdigipay (BisaTopup) — fsldk.or.id', W / 2, H - 22);

        resolve(canvas.toDataURL('image/png'));
      };
      qrImg.src = qrDataUrl;
    });
  }

  private roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxW: number, lineH: number): number {
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, cx, y);
        line = word;
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, cx, y);
    return y;
  }

  private formatExpiryForCanvas(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private timestampForFilename(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }
}
