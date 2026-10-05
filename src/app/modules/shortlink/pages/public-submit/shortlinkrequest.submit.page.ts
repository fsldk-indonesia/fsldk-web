import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { ShortLinkPIC } from '../../entities/shortlink-pic';
import { ShortlinkRequestSubmitPresenter } from './shortlinkrequest.submit.presenter';
import { ShortLinkRequestSubmitView } from './shortlinkrequest.submit.view';

/** Pola validasi SISI KLIEN — mirror persis aturan backend (lihat
 *  shortlinkrequest_dto.go `SubmitRequest` + base/validation/validation.go
 *  tag kustom `shortlinkkey`/`phonenumber`), supaya error inline muncul
 *  SEBELUM submit, bukan baru setelah request ke server ditolak. */
const WHATSAPP_PATTERN = /^[0-9+\-\s()]{8,20}$/;
const URL_PATTERN = /^https?:\/\/.+/i;
const SHORTLINK_KEY_PATTERN = /^[a-zA-Z0-9-]+$/;

type FormField = 'requesterName' | 'requesterEmail' | 'requesterWhatsapp' | 'destinationURL' | 'requestedKey' | 'note';

/**
 * Halaman publik (TANPA login) untuk mengajukan permintaan shortlink baru —
 * pola sama persis dengan Kontak (hero reusable + kanvas
 * `.section-blob-drift`, bahasa visual sama dengan Galeri/Struktur), grid
 * 2-kolom info+form dengan styling kartu & input yang sama. Diupgrade dari
 * template-driven form (FormsModule) ke Reactive Forms supaya dapat error
 * inline per-field (pola `hasError()` sama persis Kontak) — field & aturannya
 * TIDAK berubah dari versi lama, cuma validasinya sekarang kebaca sebelum
 * submit, bukan baru setelah ditolak backend.
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
  imports: [ReactiveFormsModule, RouterLink, IconComponent, PageHeroComponent],
  providers: [ShortlinkRequestSubmitPresenter],
  styles: [`
    /* ---------- Ilustrasi hero: "Rantai Tautan" — dua mata rantai saling
       kait sebagai hub (melambangkan tautan panjang yang "disambung" jadi
       pendek), garis "digambar sendiri" & simpul berdenyut pakai primitif
       global .network-node/.network-ping — mekanisme identik Kontak/Galeri/
       Struktur, motif tengahnya diganti rantai tautan, selaras tema Shortlink. ---------- */
    .hero-sl-visual { position: relative; width: 100%; }
    .sl-svg { position: relative; z-index: 1; width: 100%; height: 240px; overflow: visible; }

    .sl-silhouette {
      transform-box: fill-box; transform-origin: 50% 100%; opacity: 0;
      animation: slGrow .9s cubic-bezier(.34,1.4,.64,1) forwards;
      filter: drop-shadow(0 10px 18px rgba(0,147,59,.2));
    }
    @keyframes slGrow { from { opacity: 0; transform: scale(.75) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .sl-ground-shadow { fill: var(--color-primary-dark); opacity: .14; }
    @media (prefers-reduced-motion: reduce) { .sl-silhouette { animation: none; opacity: 1; transform: none; } }

    .sl-line { fill: none; stroke: var(--color-primary); stroke-width: 1.8; stroke-linecap: round; opacity: .55; }
    .sl-line.thick { stroke-width: 2.6; opacity: .75; stroke: var(--color-primary-bright); }
    .sl-tier { opacity: 0; animation: slTierFadeIn .4s ease-out forwards; }
    .sl-tier-0 { animation-delay: .75s; }
    .sl-tier-1 { animation-delay: 1.3s; }
    .sl-tier-2 { animation-delay: 1.8s; }
    @keyframes slTierFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .sl-badge {
      transform-box: fill-box; transform-origin: center; opacity: 0;
      animation: slBadgePop .5s cubic-bezier(.34,1.4,.64,1) 2.2s forwards;
    }
    @keyframes slBadgePop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: scale(1); } }
    @media (prefers-reduced-motion: reduce) { .sl-tier, .sl-badge { animation: none; opacity: 1; transform: none; } }

    /* ---------- Canvas transisi hero -> konten — identik Galeri/Kontak/
       Struktur: blob gradien bergeser pelan di belakang + fade-mask 70px
       atas/bawah menyatukan tepi gelombang hero dengan latar section. ---------- */
    .section { background: var(--color-primary-tint); position: relative; }
    .section-transition { position: relative; padding-top: 32px; }
    .section-blob-drift { overflow: hidden; }
    .section-blob-drift > .container { position: relative; z-index: 1; }
    .section-blob-drift::before {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 55% 55% at 88% 42%, var(--color-gold-soft) 0%, var(--color-primary-soft) 42%, transparent 75%),
        radial-gradient(ellipse 50% 50% at 10% 62%, var(--color-primary-soft) 0%, var(--color-gold-soft) 45%, transparent 75%);
      opacity: .8; animation: sectionBlobDrift 12s ease-in-out infinite alternate;
    }
    .section-blob-drift::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: linear-gradient(to bottom,
        var(--color-primary-tint) 0, transparent 70px,
        transparent calc(100% - 70px), var(--color-primary-tint) 100%);
    }
    @keyframes sectionBlobDrift {
      from { transform: translate(0, 0) scale(1); }
      to { transform: translate(-4%, 5%) scale(1.15); }
    }
    @media (prefers-reduced-motion: reduce) { .section-blob-drift::before { animation: none; } }

    .sl-grid { display: grid; grid-template-columns: 320px 1fr; gap: 28px; align-items: start; padding-top: 8px; }
    @media (max-width: 900px) { .sl-grid { grid-template-columns: 1fr; } }

    .sl-info-col { display: flex; flex-direction: column; gap: 20px; }
    .sl-info-card { padding: 26px; }
    .sl-info-card-head { display: flex; align-items: center; gap: 12px; margin: 0 0 16px; }
    .sl-info-card-head h3 { margin: 0; font-size: 1rem; }
    .sl-info-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .sl-info-list li { position: relative; padding-left: 18px; font-size: .88rem; line-height: 1.55; color: var(--color-text-secondary); }
    .sl-info-list li::before { content: ''; position: absolute; left: 0; top: 7px; width: 6px; height: 6px; border-radius: 999px; background: var(--color-primary); }
    .sl-info-list code { background: var(--color-bg-alt); padding: 2px 6px; border-radius: 4px; font-size: .82rem; color: var(--color-primary-dark); }

    .sl-pic-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .sl-pic-name { font-weight: 700; }
    .sl-pic-phone { font-size: .85rem; }
    .btn-whatsapp { background: #25d366; color: #fff; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-whatsapp:hover { background: #1da851; color: #fff; text-decoration: none; }
    .sl-pic-hint { font-size: .8rem; margin: 12px 0 0; line-height: 1.5; }

    .sl-notice-card { margin-top: 2px; padding: 20px 24px; background: #f0fdf4; border-color: #bbf7d0; display: flex; gap: 14px; align-items: flex-start; }
    .sl-notice-card .notice-text strong { display: block; font-size: .92rem; color: #166534; margin-bottom: 2px; }
    .sl-notice-card .notice-text p { margin: 0; font-size: .85rem; color: #15803d; line-height: 1.4; }

    .sl-form-card { padding: 36px; }
    @media (max-width: 640px) { .sl-form-card { padding: 24px; } }
    .sl-form-card-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 28px; }
    .sl-form-card-header h2 { margin: 0; font-size: 1.45rem; font-weight: 800; color: var(--color-text); }
    .sl-form-card-header p { margin: 6px 0 0; font-size: .92rem; color: var(--color-text-secondary); }

    /* Label kecil pemisah bagian DI DALAM form (Data Pemohon / Detail
       Tautan) — bukan eyebrow di atas heading halaman, cuma penanda
       kelompok field supaya form panjang terasa terstruktur. */
    .sl-form-section-label { display: flex; align-items: center; gap: 6px; font-size: .74rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--color-primary-dark); margin: 0 0 14px; }
    .sl-form-section-label-spaced { margin-top: 10px; padding-top: 22px; border-top: 1px dashed var(--color-border); }

    .sl-form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 640px) { .sl-form-row-2 { grid-template-columns: 1fr; gap: 0; } }

    .form-group { margin-bottom: 20px; }
    .form-label { display: block; font-weight: 700; font-size: .88rem; margin-bottom: 8px; color: var(--color-text); }
    .form-control { width: 100%; padding: 11px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: .95rem; color: var(--color-text); background: #fff; transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease; outline: none; box-sizing: border-box; }
    .form-control:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .form-control.is-invalid { border-color: var(--color-danger); background-color: #fffbfa; }
    .form-error { color: var(--color-danger); font-size: .8rem; margin-top: 5px; font-weight: 500; }
    .form-hint { color: var(--color-muted); font-size: .8rem; margin-top: 5px; }
    .sl-textarea { resize: vertical; min-height: 100px; font-family: inherit; }

    /* Ikon di dalam kotak input — identik teknik .sfs-search (search bar
       toolbar), dipindah ke konteks .form-control biasa. */
    .sl-field-icon-group { position: relative; }
    .sl-field-icon-group .sl-field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); z-index: 1; color: var(--color-muted); pointer-events: none; transition: color var(--motion-fast) ease; }
    .sl-field-icon-group .form-control { padding-left: 38px; }
    .sl-field-icon-group:focus-within .sl-field-icon { color: var(--color-primary); }

    /* Prefix domain non-editable di depan input "Custom Link yang Diinginkan"
       — pengguna hanya mengetik bagian slug-nya. focus-within dipakai karena
       ring fokus .form-control bawaan dimatikan (border digabung jadi satu
       kotak dengan prefix-nya, bukan dua kotak terpisah). */
    .input-prefix-group { display: flex; align-items: stretch; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease; }
    .input-prefix-group:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .input-prefix-group.is-invalid { border-color: var(--color-danger); }
    .input-prefix-group .form-control { border: none; border-radius: 0; box-shadow: none !important; }
    .input-prefix { display: flex; align-items: center; gap: 6px; padding: 0 12px; background: var(--color-bg-alt); color: var(--color-muted); font-size: .85rem; white-space: nowrap; border-right: 1px solid var(--color-border); flex-shrink: 0; max-width: 45%; overflow: hidden; text-overflow: ellipsis; }

    /* Pratinjau tautan hasil akhir — update langsung seiring ketikan, umpan
       balik instan daripada user cuma membayangkan hasilnya dari contoh statis. */
    .sl-link-preview { display: flex; align-items: center; gap: 6px; margin-top: 8px; padding: 8px 12px; border-radius: var(--radius-sm); background: var(--color-primary-soft); color: var(--color-primary-dark); font-size: .82rem; font-weight: 600; }
    .sl-link-preview strong { font-weight: 800; word-break: break-all; }

    .sl-label-with-counter { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .sl-label-with-counter .form-label { margin-bottom: 0; }
    .sl-char-counter { font-size: .78rem; font-weight: 600; color: var(--color-muted); }
    .sl-char-counter.is-limit { color: var(--color-danger); }

    .sl-submit-wrap { margin-top: 28px; display: flex; justify-content: flex-end; }
    .sl-submit-btn { padding: 12px 28px; font-size: .95rem; font-weight: 700; border-radius: var(--radius-full); box-shadow: 0 4px 14px rgba(0,147,59,.25); cursor: pointer; display: inline-flex; align-items: center; }

    .sl-success-screen { padding: 40px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; }
    .sl-success-icon { margin-bottom: 16px; animation: slPopIn .35s cubic-bezier(.175,.885,.32,1.275); }
    @keyframes slPopIn { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .sl-success-screen h2 { margin: 0 0 8px; font-size: 1.5rem; color: var(--color-text); }
    .sl-success-text { max-width: 440px; color: var(--color-text-secondary); line-height: 1.5; font-size: .95rem; }
  `],
})
export class ShortlinkRequestSubmitPage implements OnInit, AfterViewInit, ShortLinkRequestSubmitView {
  private presenter = inject(ShortlinkRequestSubmitPresenter);
  private fb = inject(FormBuilder);

  loading = signal(false);
  submitted = signal(false);
  submitTried = signal(false);
  pic = signal<ShortLinkPIC | null>(null);

  /** Prefix domain untuk field "Custom Link yang Diinginkan" — diambil dari
   *  window.location.origin (BUKAN di-hardcode) supaya otomatis mengikuti
   *  domain aktual tempat aplikasi ini di-deploy (dev/staging/produksi). */
  readonly baseUrl = window.location.origin;

  form = this.fb.group({
    requesterName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
    requesterEmail: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    requesterWhatsapp: ['', [Validators.required, Validators.pattern(WHATSAPP_PATTERN)]],
    destinationURL: ['', [Validators.required, Validators.pattern(URL_PATTERN), Validators.maxLength(1000)]],
    requestedKey: ['', [Validators.required, Validators.pattern(SHORTLINK_KEY_PATTERN), Validators.minLength(3), Validators.maxLength(30)]],
    note: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  @ViewChildren('slLine') private slLineRefs!: QueryList<ElementRef<SVGPathElement>>;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadPIC();
  }

  ngAfterViewInit(): void {
    this.animateSlLines();
  }

  noteLength(): number {
    return (this.form.value.note || '').length;
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
      requestedKey: this.form.value.requestedKey!.trim(),
      note: this.form.value.note!.trim(),
    });
  }

  resetForm(): void {
    this.form.reset();
    this.submitTried.set(false);
    this.submitted.set(false);
  }

  waLink(): string {
    const pic = this.pic();
    if (!pic?.picWhatsapp) return '';
    const text = `Halo ${pic.picName || 'Admin'}, saya baru saja mengajukan permintaan pembuatan shortlink lewat situs FSLDK Indonesia. Mohon bantuannya untuk diproses. Terima kasih.`;
    return `https://wa.me/${pic.picWhatsapp}?text=${encodeURIComponent(text)}`;
  }

  /** Efek "jaringan digambar sendiri" — identik animateMsgLines() (Kontak). */
  private animateSlLines(): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.slLineRefs?.forEach((ref, i) => {
      const path = ref.nativeElement;
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      if (reduced) { path.style.strokeDashoffset = '0'; return; }
      path.animate(
        [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
        { duration: 600, delay: 700 + i * 130, easing: 'ease-out', fill: 'forwards' },
      );
    });
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  onSubmitSuccess(): void { this.submitted.set(true); }
  setPIC(pic: ShortLinkPIC | null): void { this.pic.set(pic); }
}
