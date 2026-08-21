import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { ShortLinkPIC } from '../../entities/shortlink-pic';
import { ShortlinkRequestSubmitPresenter } from './shortlinkrequest.submit.presenter';
import { ShortLinkRequestSubmitView } from './shortlinkrequest.submit.view';

/**
 * Halaman publik (TANPA login) untuk mengajukan permintaan shortlink baru —
 * dipasang di bawah PublicLayoutComponent dengan path statis (`shortlink/ajukan`),
 * jadi terdaftar SEBELUM rute redirect catch-all `:key` di app.routes.ts.
 *
 * Sidebar kiri (Cara Penggunaan/Ketentuan/Konfirmasi via WhatsApp) TIDAK ada
 * di techspec-short-url.md §9.1 (spesifikasi itu hanya menyebut field form +
 * pesan sukses) — ditambahkan atas permintaan eksplisit setelah dikonfirmasi
 * bukan cakupan spec, isinya ditulis ulang untuk konteks FSLDK Indonesia
 * (bukan salinan teks referensi UKM LDK Syahid UIN Jakarta).
 */
@Component({
  selector: 'app-shortlinkrequest-submit-page',
  standalone: true,
  templateUrl: './shortlinkrequest.submit.page.html',
  imports: [FormsModule, RouterLink, IconComponent],
  providers: [ShortlinkRequestSubmitPresenter],
  styles: [`
    .section { background: linear-gradient(180deg, var(--color-primary-soft) 0%, var(--color-primary-tint) 220px, #fff 520px); }
    .page-head { text-align: center; margin-bottom: 28px; }
    .page-head h1 { margin-bottom: 6px; }

    .layout-grid { display: grid; grid-template-columns: 300px 1fr; gap: 24px; align-items: start; }
    @media (max-width: 860px) { .layout-grid { grid-template-columns: 1fr; } }

    .info-col { display: flex; flex-direction: column; gap: 20px; }
    .info-card { padding: 22px; }
    .info-card h3 { display: flex; align-items: center; gap: 8px; font-size: 1rem; margin: 0 0 14px; }
    .info-card h3 app-icon { color: var(--color-primary); flex-shrink: 0; }
    .info-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .info-list li { position: relative; padding-left: 18px; font-size: .88rem; line-height: 1.55; color: var(--color-text-secondary); }
    .info-list li::before { content: ''; position: absolute; left: 0; top: 7px; width: 6px; height: 6px; border-radius: 999px; background: var(--color-primary); }
    .info-list code { background: var(--color-bg-alt); padding: 2px 6px; border-radius: 4px; font-size: .82rem; color: var(--color-primary-dark); }

    .pic-label { display: block; font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); margin-bottom: 12px; }
    .pic-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .pic-name { font-weight: 700; }
    .pic-phone { font-size: .85rem; }
    .btn-whatsapp { background: #25d366; color: #fff; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-whatsapp:hover { background: #1da851; color: #fff; text-decoration: none; }
    .pic-hint { font-size: .8rem; margin: 12px 0 0; line-height: 1.5; }

    .form-card { width: 100%; }

    /* Prefix domain non-editable di depan input "Custom Link yang Diinginkan"
       — pengguna hanya mengetik bagian slug-nya. focus-within dipakai karena
       ring fokus .form-control bawaan dimatikan (border digabung jadi satu
       kotak dengan prefix-nya, bukan dua kotak terpisah). */
    .input-prefix-group { display: flex; align-items: stretch; border: 1px solid var(--color-border); border-radius: var(--radius-xs); overflow: hidden; transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease; }
    .input-prefix-group:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .input-prefix-group .form-control { border: none; border-radius: 0; box-shadow: none !important; }
    .input-prefix { display: flex; align-items: center; padding: 0 12px; background: var(--color-bg-alt); color: var(--color-muted); font-size: .85rem; white-space: nowrap; border-right: 1px solid var(--color-border); flex-shrink: 0; max-width: 45%; overflow: hidden; text-overflow: ellipsis; }

    .success { text-align: center; padding: 20px 0; }
    .success .icon { width: 56px; height: 56px; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 1.6rem; }
  `],
})
export class ShortlinkRequestSubmitPage implements OnInit, ShortLinkRequestSubmitView {
  private presenter = inject(ShortlinkRequestSubmitPresenter);

  loading = signal(false);
  submitted = signal(false);
  pic = signal<ShortLinkPIC | null>(null);

  /** Prefix domain untuk field "Custom Link yang Diinginkan" — diambil dari
   *  window.location.origin (BUKAN di-hardcode) supaya otomatis mengikuti
   *  domain aktual tempat aplikasi ini di-deploy (dev/staging/produksi). */
  readonly baseUrl = window.location.origin;

  requesterName = '';
  requesterEmail = '';
  requesterWhatsapp = '';
  destinationURL = '';
  requestedKey = '';
  note = '';

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadPIC();
  }

  submit(): void {
    this.presenter.submit({
      requesterName: this.requesterName,
      requesterEmail: this.requesterEmail,
      requesterWhatsapp: this.requesterWhatsapp,
      destinationURL: this.destinationURL,
      requestedKey: this.requestedKey,
      note: this.note,
    });
  }

  waLink(): string {
    const pic = this.pic();
    if (!pic?.picWhatsapp) return '';
    const text = `Halo ${pic.picName || 'Admin'}, saya baru saja mengajukan permintaan pembuatan shortlink lewat situs FSLDK Indonesia. Mohon bantuannya untuk diproses. Terima kasih.`;
    return `https://wa.me/${pic.picWhatsapp}?text=${encodeURIComponent(text)}`;
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  onSubmitSuccess(): void { this.submitted.set(true); }
  setPIC(pic: ShortLinkPIC | null): void { this.pic.set(pic); }
}
