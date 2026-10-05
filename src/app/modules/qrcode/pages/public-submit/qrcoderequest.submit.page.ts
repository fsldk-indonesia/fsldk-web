import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { BottomSheetComponent } from '../../../../shared/bottom-sheet.component';
import { QRCodePIC } from '../../entities/qrcode-pic';
import {
  QrcodeStyleEditorComponent, QrcodeStyleValue, defaultQrcodeStyle,
} from '../../components/qrcode-style-editor/qrcode-style-editor.component';
import { QrcodeHeroVisualComponent } from '../../components/qrcode-hero-visual/qrcode-hero-visual.component';
import { QR_ICON_PRESETS, QR_PREVIEW_EXAMPLE_URL } from '../../qrcode-preview';
import { QrcodeRequestSubmitPresenter } from './qrcoderequest.submit.presenter';
import { QRCodeRequestSubmitView } from './qrcoderequest.submit.view';

const WHATSAPP_PATTERN = /^[0-9+\-\s()]{8,20}$/;
const URL_PATTERN = /^https?:\/\/.+/i;

type FormField = 'requesterName' | 'requesterEmail' | 'requesterWhatsapp' | 'destinationURL' | 'note';

/**
 * Halaman publik (TANPA login) untuk mengajukan permintaan QR Code baru —
 * pola sama dengan halaman pengajuan Shortlink (hero reusable + kanvas
 * `.section-blob-drift`), diupgrade dari FormsModule ke Reactive Forms untuk
 * error inline per-field. Editor gaya QR (warna/ikon) ditampilkan inline di
 * desktop, tapi dipindah ke `app-bottom-sheet` di layar mobile (dipicu lewat
 * kartu ringkasan) supaya form utama tidak kepanjangan di layar kecil —
 * kedua blok berbagi satu `style` yang sama, cuma salah satunya yang
 * ditampilkan tergantung lebar layar (CSS media query, pola sama seperti
 * grid desktop vs tile mobile di Goods).
 */
@Component({
  selector: 'app-qrcoderequest-submit-page',
  standalone: true,
  templateUrl: './qrcoderequest.submit.page.html',
  imports: [
    ReactiveFormsModule, RouterLink, IconComponent, PageHeroComponent,
    BottomSheetComponent, QrcodeStyleEditorComponent, QrcodeHeroVisualComponent,
  ],
  providers: [QrcodeRequestSubmitPresenter],
  styles: [`
    /* ---------- Section hijau PENUH tepi-ke-tepi + siluet ikon raksasa
       pudar — pola sama persis FSLDK Goods/Format Keuangan/Perpustakaan/
       Berita (lihat goods.public-index.page.ts .section), BUKAN tint lembut
       .section-blob-drift. Hero di atasnya pakai waveColor hijau solid
       (lihat .page.html) supaya gelombangnya menyambung lurus ke section
       ini tanpa warna pucat nongol di antaranya. ---------- */
    .section { position: relative; overflow: hidden; background: var(--color-primary); padding: 56px 0 72px; }
    .qr-panel-silhouette { position: absolute; right: 8px; bottom: 8px; z-index: 0; color: rgba(255,255,255,.12); transform: rotate(-12deg); pointer-events: none; }
    .qr-panel-silhouette-2 { position: absolute; left: 8px; top: 8px; z-index: 0; color: rgba(255,255,255,.08); transform: rotate(16deg); pointer-events: none; }
    .section > .container { position: relative; z-index: 1; }

    .qr-grid { display: grid; grid-template-columns: 320px 1fr; gap: 28px; align-items: start; padding-top: 8px; }
    @media (max-width: 900px) { .qr-grid { grid-template-columns: 1fr; } }

    .qr-info-col { display: flex; flex-direction: column; gap: 20px; }
    .qr-info-card { padding: 26px; }
    .qr-info-card-head { display: flex; align-items: center; gap: 12px; margin: 0 0 16px; }
    .qr-info-card-head h3 { margin: 0; font-size: 1rem; }
    .qr-info-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .qr-info-list li { position: relative; padding-left: 18px; font-size: .88rem; line-height: 1.55; color: var(--color-text-secondary); }
    .qr-info-list li::before { content: ''; position: absolute; left: 0; top: 7px; width: 6px; height: 6px; border-radius: 999px; background: var(--color-primary); }
    .qr-info-list code { background: var(--color-bg-alt); padding: 2px 6px; border-radius: 4px; font-size: .82rem; color: var(--color-primary-dark); }

    .qr-pic-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .qr-pic-name { font-weight: 700; }
    .qr-pic-phone { font-size: .85rem; }
    .btn-whatsapp { background: #25d366; color: #fff; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-whatsapp:hover { background: #1da851; color: #fff; text-decoration: none; }
    .qr-pic-hint { font-size: .8rem; margin: 12px 0 0; line-height: 1.5; }

    .qr-notice-card { margin-top: 2px; padding: 20px 24px; background: #f0fdf4; border-color: #bbf7d0; display: flex; gap: 14px; align-items: flex-start; }
    .qr-notice-card .notice-text strong { display: block; font-size: .92rem; color: #166534; margin-bottom: 2px; }
    .qr-notice-card .notice-text p { margin: 0; font-size: .85rem; color: #15803d; line-height: 1.4; }

    .qr-form-card { padding: 36px; }
    @media (max-width: 640px) { .qr-form-card { padding: 24px; } }
    .qr-form-card-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 28px; }
    .qr-form-card-header h2 { margin: 0; font-size: 1.45rem; font-weight: 800; color: var(--color-text); }
    .qr-form-card-header p { margin: 6px 0 0; font-size: .92rem; color: var(--color-text-secondary); }

    .qr-form-section-label { display: flex; align-items: center; gap: 6px; font-size: .74rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--color-primary-dark); margin: 0 0 14px; }
    .qr-form-section-label-spaced { margin-top: 10px; padding-top: 22px; border-top: 1px dashed var(--color-border); }

    .qr-form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 640px) { .qr-form-row-2 { grid-template-columns: 1fr; gap: 0; } }

    .form-group { margin-bottom: 20px; }
    .form-label { display: block; font-weight: 700; font-size: .88rem; margin-bottom: 8px; color: var(--color-text); }
    .form-control { width: 100%; padding: 11px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: .95rem; color: var(--color-text); background: #fff; transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease; outline: none; box-sizing: border-box; }
    .form-control:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .form-control.is-invalid { border-color: var(--color-danger); background-color: #fffbfa; }
    .form-error { color: var(--color-danger); font-size: .8rem; margin-top: 5px; font-weight: 500; }
    .form-hint { color: var(--color-muted); font-size: .8rem; margin-top: 5px; }
    .qr-textarea { resize: vertical; min-height: 100px; font-family: inherit; }

    .qr-field-icon-group { position: relative; }
    .qr-field-icon-group .qr-field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); z-index: 1; color: var(--color-muted); pointer-events: none; transition: color var(--motion-fast) ease; }
    .qr-field-icon-group .form-control { padding-left: 38px; }
    .qr-field-icon-group:focus-within .qr-field-icon { color: var(--color-primary); }

    /* ---------- Kartu "Tampilan QR" — pratinjau ringkas warna/ikon yang
       sedang dipilih. Di desktop editor lengkap tampil langsung di bawahnya;
       di mobile (lihat .style-mobile-trigger) kartu ini jadi tombol pembuka
       bottom sheet, editornya sendiri tidak dirender inline. ---------- */
    .style-swatch-pair { display: flex; gap: -6px; }
    .style-swatch-dot { width: 22px; height: 22px; border-radius: 7px; border: 2px solid #fff; box-shadow: 0 0 0 1.5px var(--color-border); }
    .style-swatch-dot + .style-swatch-dot { margin-left: -6px; }
    .style-icon-chip-wrap { width: 30px; height: 30px; border-radius: 8px; background: var(--color-bg-warm); border: 1.5px solid var(--color-border); display: flex; align-items: center; justify-content: center; color: var(--color-text-secondary); overflow: hidden; }
    .style-icon-chip-wrap img { width: 16px; height: 16px; }

    .style-inline-block { margin-top: 2px; }
    @media (max-width: 760px) { .style-inline-block { display: none; } }

    .style-mobile-trigger { display: none; }
    @media (max-width: 760px) {
      .style-mobile-trigger {
        display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 16px;
        border: 1.5px dashed var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-warm);
        cursor: pointer; text-align: left; transition: border-color var(--motion-fast) ease, background var(--motion-fast) ease;
      }
      .style-mobile-trigger:active { border-color: var(--color-primary); background: var(--color-primary-soft); }
    }
    .style-mobile-trigger-meta { flex: 1; min-width: 0; }
    .style-mobile-trigger-title { font-size: .88rem; font-weight: 700; color: var(--color-text); margin: 0 0 3px; }
    .style-mobile-trigger-sub { font-size: .78rem; color: var(--color-muted); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .style-mobile-trigger-chevron { color: var(--color-muted); flex-shrink: 0; }
    .style-sheet-title { font-size: 1.1rem; font-weight: 800; margin: 0 0 4px; }
    .style-sheet-sub { font-size: .85rem; color: var(--color-text-secondary); margin: 0 0 18px; }

    .qr-submit-wrap { margin-top: 28px; display: flex; justify-content: flex-end; }
    .qr-submit-btn { padding: 12px 28px; font-size: .95rem; font-weight: 700; border-radius: var(--radius-full); box-shadow: 0 4px 14px rgba(0,147,59,.25); cursor: pointer; display: inline-flex; align-items: center; }

    .qr-success-screen { padding: 40px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; }
    .qr-success-icon { margin-bottom: 16px; animation: qrPopIn .35s cubic-bezier(.175,.885,.32,1.275); }
    @keyframes qrPopIn { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .qr-success-screen h2 { margin: 0 0 8px; font-size: 1.5rem; color: var(--color-text); }
    .qr-success-text { max-width: 440px; color: var(--color-text-secondary); line-height: 1.5; font-size: .95rem; }
  `],
})
export class QrcodeRequestSubmitPage implements OnInit, QRCodeRequestSubmitView {
  private presenter = inject(QrcodeRequestSubmitPresenter);
  private fb = inject(FormBuilder);

  loading = signal(false);
  submitted = signal(false);
  submitTried = signal(false);
  pic = signal<QRCodePIC | null>(null);
  styleSheetOpen = signal(false);

  style: QrcodeStyleValue = defaultQrcodeStyle();
  readonly previewDummyUrl = QR_PREVIEW_EXAMPLE_URL;
  readonly iconPresets = QR_ICON_PRESETS;

  form = this.fb.group({
    requesterName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
    requesterEmail: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    requesterWhatsapp: ['', [Validators.required, Validators.pattern(WHATSAPP_PATTERN)]],
    destinationURL: ['', [Validators.required, Validators.pattern(URL_PATTERN), Validators.maxLength(1000)]],
    note: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadPIC();
  }

  onStyleChange(value: QrcodeStyleValue): void {
    this.style = value;
  }

  currentIconLabel(): string {
    if (this.style.centerIconKey) {
      return this.iconPresets.find((p) => p.key === this.style.centerIconKey)?.label || 'Preset';
    }
    return this.style.centerIconURL ? 'Kustom' : 'Tanpa ikon';
  }

  hasError(field: FormField): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.touched || this.submitTried()));
  }

  submit(): void {
    this.submitTried.set(true);
    if (this.form.invalid) return;
    this.presenter.submit({
      requesterName: this.form.value.requesterName!.trim(),
      requesterEmail: this.form.value.requesterEmail!.trim(),
      requesterWhatsapp: this.form.value.requesterWhatsapp!.trim(),
      destinationURL: this.form.value.destinationURL!.trim(),
      foregroundColor: this.style.foregroundColor,
      backgroundColor: this.style.backgroundColor,
      centerIconURL: this.style.centerIconURL,
      centerIconKey: this.style.centerIconKey,
      captionText: this.style.captionText,
      note: this.form.value.note!.trim(),
    });
  }

  waLink(): string {
    const pic = this.pic();
    if (!pic?.picWhatsapp) return '';
    const text = `Halo ${pic.picName || 'Admin'}, saya baru saja mengajukan permintaan pembuatan QR Code lewat situs FSLDK Indonesia. Mohon bantuannya untuk diproses. Terima kasih.`;
    return `https://wa.me/${pic.picWhatsapp}?text=${encodeURIComponent(text)}`;
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  onSubmitSuccess(): void { this.submitted.set(true); }
  setPIC(pic: QRCodePIC | null): void { this.pic.set(pic); }
}
