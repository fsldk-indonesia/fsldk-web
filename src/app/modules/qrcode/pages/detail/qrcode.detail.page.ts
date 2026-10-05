import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { IconComponent } from '../../../../shared/icon.component';
import { PageLoaderComponent } from '../../../../shared/page-loader.component';
import { QRCodePublic } from '../../entities/qrcode-public';
import { QrcodeDetailPresenter } from './qrcode.detail.presenter';
import { QrcodeDetailView } from './qrcode.detail.view';

/**
 * Halaman publik permalink "hasil scan" satu QR Code (/qr/:id) — tautannya
 * dikirim ke pemohon lewat WhatsApp/email saat permintaan QR disetujui
 * (lihat detailPageURL() di qrcoderequest_service_impl.go backend).
 *
 * SENGAJA dipasang sebagai top-level route di app.routes.ts, BUKAN anak
 * PublicLayoutComponent — tidak ada navbar/footer/WhatsApp FAB landing page
 * ataupun hero-copy (badge/judul/kutipan). Backdrop penuh-layar memakai
 * bahasa visual gradien diagonal hijau tua + tekstur titik + glow emas yang
 * SAMA PERSIS dengan `.hero-section`/`.hero-texture`/`.hero-glow` milik hero
 * gelap FSLDK Goods/Galeri/Berita detail (lihat goods.public-detail.page.ts)
 * — mekanisme sama yang juga dipakai AuthLayoutComponent untuk kartu
 * login/daftar. Satu-satunya jalan keluar adalah tautan "Kembali ke
 * Beranda" di bawah kartu (pola sama seperti AuthLayoutComponent).
 */
@Component({
  selector: 'app-qrcode-detail-page',
  standalone: true,
  templateUrl: './qrcode.detail.page.html',
  imports: [DatePipe, FormsModule, RouterLink, IconComponent, PageLoaderComponent],
  providers: [QrcodeDetailPresenter],
  styles: [`
    .qr-wash {
      position: relative; overflow: hidden; min-height: 100dvh;
      display: flex; align-items: center; justify-content: center;
      padding: 48px 24px;
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 62%, var(--color-primary-darker) 100%);
    }
    .qr-wash-glow {
      position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: radial-gradient(ellipse 55% 65% at 88% 30%, rgba(255,196,0,.18) 0%, transparent 70%);
    }
    .qr-wash-texture {
      position: absolute; inset: 0; z-index: 0; opacity: .5; pointer-events: none;
      background-image: radial-gradient(circle, rgba(255,255,255,.5) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 15% -10px;
      mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
    }

    .qr-wash-content { position: relative; z-index: 1; width: 100%; max-width: 480px; }

    .qr-card { text-align: center; padding: 36px; box-shadow: 0 24px 50px rgba(0,0,0,.35); }
    @media (max-width: 560px) { .qr-card { padding: 26px 20px; } }
    .qr-card h1 { font-size: 1.4rem; margin: 0 0 4px; font-weight: 800; }
    .qr-card .created { font-size: .82rem; color: var(--color-muted); margin: 0 0 24px; display: flex; align-items: center; justify-content: center; gap: 6px; }

    .qr-frame-wrap { position: relative; display: inline-block; padding: 20px; }
    .qr-frame {
      border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 18px; background: #fff;
      box-shadow: 0 10px 30px rgba(20,23,26,.1);
    }
    .qr-frame img { display: block; width: 240px; max-width: 100%; height: auto; border-radius: 6px; }
    /* Bracket kamera "mencari fokus" — tiap sudut membesar/mengecil menjauh
       dari sudut bingkainya sendiri (transform-origin di titik sudut
       masing-masing, bukan center) supaya kesannya menjepit/melonggar ke
       arah luar seperti viewfinder kamera, bukan sekadar membesar di tempat. */
    .qr-corner { position: absolute; width: 26px; height: 26px; border: 3px solid var(--color-primary); opacity: .7; animation: qrCornerPulse 2.2s ease-in-out infinite; }
    .qr-corner.tl { top: 0; left: 0; border-right: none; border-bottom: none; border-radius: 10px 0 0 0; transform-origin: top left; }
    .qr-corner.tr { top: 0; right: 0; border-left: none; border-bottom: none; border-radius: 0 10px 0 0; transform-origin: top right; }
    .qr-corner.bl { bottom: 0; left: 0; border-right: none; border-top: none; border-radius: 0 0 0 10px; transform-origin: bottom left; }
    .qr-corner.br { bottom: 0; right: 0; border-left: none; border-top: none; border-radius: 0 0 10px 0; transform-origin: bottom right; }
    @keyframes qrCornerPulse {
      0%, 100% { transform: scale(1); opacity: .7; }
      50% { transform: scale(1.22); opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) { .qr-corner { animation: none; } }

    .caption-chip { display: inline-flex; align-items: center; gap: 6px; margin: 16px 0 0; padding: 6px 14px; border-radius: var(--radius-full); background: var(--color-primary-soft); color: var(--color-primary-dark); font-weight: 700; font-size: .85rem; }

    .dest-chip {
      display: flex; align-items: center; gap: 8px; margin: 18px 0 0; padding: 10px 14px; border-radius: var(--radius-sm);
      background: var(--color-bg-warm); border: 1px solid var(--color-border); text-align: left;
    }
    .dest-chip app-icon { flex-shrink: 0; color: var(--color-primary); }
    .dest-chip-text { min-width: 0; }
    .dest-chip-label { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); display: block; }
    .dest-chip a { font-size: .86rem; color: var(--color-primary-dark); font-weight: 600; word-break: break-all; }

    .size-picker { margin: 26px 0 0; text-align: left; }
    .size-picker .qse-label { display: flex; align-items: center; gap: 6px; font-size: .78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-primary-dark); margin-bottom: 10px; }
    .size-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .size-opt {
      padding: 7px 16px; border: 1.5px solid var(--color-border); border-radius: var(--radius-full); background: #fff;
      font-size: .85rem; font-weight: 700; cursor: pointer; color: var(--color-text-secondary);
      transition: border-color var(--motion-fast) ease, background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .size-opt:hover { border-color: var(--color-primary); }
    .size-opt.active { border-color: var(--color-primary); background: var(--color-primary); color: #fff; }
    .size-input { width: 110px; border-radius: var(--radius-full); text-align: center; }
    .size-hint { font-size: .78rem; color: var(--color-muted); margin: 10px 0 0; }

    .actions { margin: 24px 0 0; display: flex; flex-direction: column; gap: 10px; }
    .qr-download-btn {
      padding: 13px 20px; font-size: .95rem; font-weight: 700; border-radius: var(--radius-full);
      box-shadow: 0 4px 14px rgba(0,147,59,.25); display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .hint { font-size: .82rem; color: var(--color-muted); line-height: 1.6; margin: 20px 0 0; }

    .next-cta {
      margin: 16px 0 0; padding: 18px 22px; display: flex; align-items: center; gap: 16px;
      justify-content: space-between; flex-wrap: wrap; box-shadow: 0 16px 36px rgba(0,0,0,.25);
    }
    .next-cta-text strong { display: block; font-size: .92rem; color: var(--color-text); }
    .next-cta-text p { margin: 2px 0 0; font-size: .82rem; color: var(--color-text-secondary); }

    .qr-back-home {
      display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 18px;
      font-size: .85rem; font-weight: 700; color: rgba(255,255,255,.85); text-decoration: none;
    }
    .qr-back-home:hover { color: #fff; text-decoration: none; }

    .center-screen-card { text-align: center; padding: 48px 28px; }
  `],
})
export class QrcodeDetailPage implements OnInit, QrcodeDetailView {
  private presenter = inject(QrcodeDetailPresenter);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  loading = signal(true);
  notFound = signal(false);
  downloading = signal(false);
  qr = signal<QRCodePublic | null>(null);
  private id = 0;

  readonly minSize = 128;
  readonly maxSize = 1024;
  readonly presetSizes = [256, 512, 1024];
  size = signal(1024);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.id || this.id < 1) { this.setNotFound(); return; }
    this.presenter.load(this.id);
  }

  setSize(value: number | string): void {
    let n = Math.round(Number(value));
    if (!Number.isFinite(n)) return;
    n = Math.min(this.maxSize, Math.max(this.minSize, n));
    this.size.set(n);
  }

  download(): void { this.presenter.download(this.id, this.size()); }

  copyImageLink(): void {
    const url = this.qr()?.imageURL;
    if (!url) return;
    navigator.clipboard.writeText(`${url}?size=${this.size()}`).then(
      () => this.toast.success('Tautan gambar disalin'),
      () => this.toast.error('Gagal menyalin tautan'),
    );
  }

  setQrcode(qr: QRCodePublic): void { this.qr.set(qr); this.loading.set(false); }
  setNotFound(): void { this.notFound.set(true); this.loading.set(false); }
  setDownloading(downloading: boolean): void { this.downloading.set(downloading); }
  saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
