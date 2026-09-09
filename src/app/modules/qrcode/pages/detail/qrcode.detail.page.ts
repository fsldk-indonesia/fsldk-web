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
 * Halaman publik (TANPA login) detail + unduh satu QR Code — dipasang di bawah
 * PublicLayoutComponent, path `qr/:id`. Tautannya dikirim ke pemohon lewat
 * WhatsApp/email saat permintaan disetujui, menggantikan tautan gambar mentah
 * ke API. Bukan redirect: gambar QR meng-encode URL tujuan langsung.
 */
@Component({
  selector: 'app-qrcode-detail-page',
  standalone: true,
  templateUrl: './qrcode.detail.page.html',
  imports: [DatePipe, FormsModule, RouterLink, IconComponent, PageLoaderComponent],
  providers: [QrcodeDetailPresenter],
  styles: [`
    .section { background: linear-gradient(180deg, var(--color-primary-soft) 0%, var(--color-primary-tint) 200px, #fff 460px); }
    .wrap { max-width: 520px; margin: 0 auto; }
    .qr-card { text-align: center; padding: 28px; }
    .qr-card h1 { font-size: 1.4rem; margin: 0 0 4px; }
    .qr-card .created { font-size: .82rem; color: var(--color-muted); margin: 0 0 20px; }
    .qr-frame { display: inline-block; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px; background: #fff; }
    .qr-frame img { display: block; width: 260px; max-width: 100%; height: auto; }
    .caption { font-weight: 600; margin: 12px 0 0; }
    .dest { margin: 18px 0 0; font-size: .88rem; color: var(--color-text-secondary); word-break: break-all; }
    .dest a { color: var(--color-primary-dark); }
    .size-picker { margin: 22px 0 0; text-align: left; }
    .size-picker .form-label { display: block; margin-bottom: 8px; }
    .size-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .size-opt { padding: 7px 14px; border: 1.5px solid var(--color-border); border-radius: 8px; background: var(--color-bg-warm); font-size: .85rem; font-weight: 600; cursor: pointer; }
    .size-opt:hover { border-color: var(--color-primary); }
    .size-opt.active { border-color: var(--color-primary); background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .size-input { width: 110px; }
    .size-hint { font-size: .78rem; color: var(--color-muted); margin: 8px 0 0; }
    .actions { margin: 16px 0 0; display: flex; flex-direction: column; gap: 10px; }
    .hint { font-size: .82rem; color: var(--color-muted); line-height: 1.6; margin: 18px 0 0; }
    .center-screen { min-height: 50vh; display: flex; align-items: center; justify-content: center; }
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

  /** Ukuran gambar yang diunduh — dibatasi sama dengan clamp backend. */
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
