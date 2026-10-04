import { AfterViewInit, Component, ElementRef, OnDestroy, QueryList, ViewChildren, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactRepository } from '../../repositories/contact.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { SettingApiService } from '../../../setting/services/setting-api.service';
import { IconComponent } from '../../../../shared/icon.component';
import { NewsletterFormComponent } from '../../../../shared/newsletter-form.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';

/**
 * Public Contact Us page with official organization contacts and interactive inquiry form.
 */
@Component({
  selector: 'app-contact-public-index',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, NewsletterFormComponent, PageHeroComponent],
  template: `
    <!-- Hero publik reusable (shared/page-hero.component.ts): teks lewat input,
         ilustrasi "Jaringan Pesan" diproyeksikan lewat slot [heroVisual] (style
         & animasi garisnya tetap di sini — lihat animateMsgLines() + .msg-*
         di styles). Kartu kutipan Hadis sudah jadi bagian tetap hero itu. -->
    <app-page-hero
      badge="Tentang Kami · FSLDK Indonesia"
      title="Mari Terhubung,"
      titleAccent="Bersama Dakwah Kampus"
      subtitle="Ada pertanyaan, kolaborasi dakwah, atau aspirasi kampus? Kami siap mendengar dan bersinergi bersama Anda."
      quoteSource="hadith">
      <div heroVisual class="hero-message-hub">
        <svg aria-hidden="true" viewBox="0 0 480 320" class="msg-svg">
          <defs>
            <linearGradient id="msgEnvelopeFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="var(--color-primary-bright)" stop-opacity=".92" />
              <stop offset="100%" stop-color="var(--color-primary)" stop-opacity=".82" />
            </linearGradient>
            <filter id="msgSoftBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>

          <!-- Siluet "amplop" — hub tempat pesan dari jaringan LDK se-Indonesia
               berkumpul, ditopang bayangan tanah lembut (sama persis teknik
               #treeSoftBlur di Struktur). -->
          <g class="msg-envelope-silhouette">
            <ellipse class="msg-ground-shadow" cx="240" cy="224" rx="85" ry="9" filter="url(#msgSoftBlur)" />
            <rect class="msg-envelope-body" x="170" y="110" width="140" height="100" rx="14" />
            <path class="msg-envelope-flap" d="M170,110 L240,162 L310,110" />
          </g>

          <!-- Garis "digambar sendiri" (lihat animateMsgLines()) — jalur utama
               (amplop -> hub daerah) lebih tebal/terang dari jalur turunan
               (hub daerah -> LDK), identik pembagian tier di Struktur. -->
          <path #msgLine class="msg-line thick" d="M240,160 L120,85" />
          <path #msgLine class="msg-line thick" d="M240,160 L240,45" />
          <path #msgLine class="msg-line thick" d="M240,160 L360,85" />
          <path #msgLine class="msg-line" d="M120,85 L55,70" />
          <path #msgLine class="msg-line" d="M120,85 L75,150" />
          <path #msgLine class="msg-line" d="M240,45 L190,15" />
          <path #msgLine class="msg-line" d="M240,45 L290,15" />
          <path #msgLine class="msg-line" d="M360,85 L425,70" />
          <path #msgLine class="msg-line" d="M360,85 L405,150" />

          <g class="msg-tier msg-tier-0">
            <circle class="network-ping" cx="240" cy="160" r="15" />
            <circle class="network-node" cx="240" cy="160" r="15" />
          </g>
          <g class="msg-tier msg-tier-1">
            <circle class="network-ping gold" cx="120" cy="85" r="10" style="animation-delay:.3s" />
            <circle class="network-node gold" cx="120" cy="85" r="10" />
            <circle class="network-ping gold" cx="240" cy="45" r="10" style="animation-delay:.6s" />
            <circle class="network-node gold" cx="240" cy="45" r="10" />
            <circle class="network-ping gold" cx="360" cy="85" r="10" style="animation-delay:.9s" />
            <circle class="network-node gold" cx="360" cy="85" r="10" />
          </g>
          <g class="msg-tier msg-tier-2">
            <circle class="network-node ember" cx="55" cy="70" r="6" />
            <circle class="network-node ember" cx="75" cy="150" r="6" />
            <circle class="network-node ember" cx="190" cy="15" r="6" />
            <circle class="network-node ember" cx="290" cy="15" r="6" />
            <circle class="network-node ember" cx="425" cy="70" r="6" />
            <circle class="network-node ember" cx="405" cy="150" r="6" />
          </g>

          <!-- Centang "terkirim" — pop-in setelah seluruh jaringan tergambar. -->
          <g class="msg-sent-badge">
            <circle cx="322" cy="96" r="17" fill="#fff" stroke="var(--color-gold)" stroke-width="3" />
            <path d="M313,96 L320,103 L332,88" fill="none" stroke="var(--color-gold-dark)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" />
          </g>
        </svg>
      </div>
    </app-page-hero>

    <section class="section section-transition section-blob-drift">
      <div class="container pb-xl">
        <div class="contact-grid">
          <!-- Left Column: Official Contact Information -->
          <div class="contact-info-col">
            <div class="card card-hover info-card stagger-in" style="--stagger-i: 0">
              <div class="info-items">
                <div class="info-item">
                  <span class="icon-badge sm icon-badge-solid"><app-icon name="map-pin" [size]="17" /></span>
                  <div class="item-content">
                    <span class="item-label">Alamat</span>
                    <span class="item-value">Plaza Aminta Lantai 5/504 Jl TB Simatupang Kav.10 - Pondok Pinang Kebayoran Lama - Jakarta Selatan 12310</span>
                  </div>
                </div>

                <div class="info-item">
                  <span class="icon-badge sm icon-badge-gold"><app-icon name="envelope" [size]="17" /></span>
                  <div class="item-content">
                    <span class="item-label">Email Resmi</span>
                    <a [href]="'mailto:' + contactEmail()" class="item-link">{{ contactEmail() }}</a>
                  </div>
                </div>

                <div class="info-item">
                  <span class="icon-badge sm icon-badge-ember"><app-icon name="whatsapp" [size]="17" /></span>
                  <div class="item-content">
                    <span class="item-label">WhatsApp</span>
                    <a [href]="'https://wa.me/' + whatsappNumber()" target="_blank" rel="noopener noreferrer" class="item-link">{{ whatsappDisplay() }}</a>
                  </div>
                </div>
              </div>

              <hr class="info-divider" />

              <div class="social-section">
                <span class="social-title">Media Sosial Resmi:</span>
                <div class="social-links">
                  <a href="https://www.instagram.com/fsldkindonesia/" target="_blank" rel="noopener noreferrer" class="social-badge">
                    <app-icon name="instagram" [size]="15" />
                    <span>&#64;fsldkindonesia</span>
                  </a>
                  <a href="https://www.facebook.com/FSLDKIndonesia/" target="_blank" rel="noopener noreferrer" class="social-badge">
                    <app-icon name="facebook" [size]="15" />
                    <span>&#64;fsldkindonesia</span>
                  </a>
                  <a href="https://www.tiktok.com/@fsldkindonesia" target="_blank" rel="noopener noreferrer" class="social-badge">
                    <app-icon name="tiktok" [size]="15" />
                    <span>&#64;fsldkindonesia</span>
                  </a>
                  <a href="https://www.youtube.com/@fsldk-indonesia" target="_blank" rel="noopener noreferrer" class="social-badge">
                    <app-icon name="youtube" [size]="15" />
                    <span>youtube/fsldk-indonesia</span>
                  </a>
                </div>
              </div>
            </div>

            <!-- Helpful Notice Card -->
            <div class="card card-hover notice-card stagger-in" style="--stagger-i: 1">
              <span class="icon-badge md icon-badge-soft"><app-icon name="info" [size]="19" /></span>
              <div class="notice-text">
                <strong>Respons Cepat</strong>
                <p>Setiap pesan yang masuk melalui formulir ini akan diteruskan langsung ke divisi terkait dan dijawab dalam 1x24 jam kerja.</p>
              </div>
            </div>

            <!-- Newsletter Signup Card -->
            <div class="card card-hover newsletter-card stagger-in" style="--stagger-i: 2">
              <div class="newsletter-card-header">
                <span class="icon-badge md icon-badge-gold"><app-icon name="mail" [size]="18" /></span>
                <div>
                  <strong>Berlangganan Newsletter</strong>
                  <p>Dapatkan kabar berita, artikel, dan agenda dakwah kampus langsung ke email Anda.</p>
                </div>
              </div>
              <app-newsletter-form />
            </div>
          </div>

          <!-- Right Column: Interactive Contact Form -->
          <div class="contact-form-col">
            <div class="card card-hover form-card stagger-in" style="--stagger-i: 1">
              @if (submittedSuccess()) {
                <!-- Success State Screen -->
                <div class="success-screen">
                  <span class="icon-badge lg icon-badge-solid success-icon-wrap"><app-icon name="check-circle" [size]="30" /></span>
                  <h2>Pesan Berhasil Terkirim!</h2>
                  <p class="success-text">
                    Jazakumullah khairan khatsiran. Pesan Anda telah kami terima dengan baik. Tim sekretariat FSLDK Indonesia akan meninjau dan merespon secepatnya.
                  </p>
                  <button type="button" class="btn btn-primary mt-lg" (click)="resetForm()">
                    <app-icon name="plus" [size]="16" /> Kirim Pesan Lainnya
                  </button>
                </div>
              } @else {
                <div class="form-card-header">
                  <h2>Kirimkan Pesan</h2>
                  <p class="form-card-subtitle">
                    Silakan lengkapi formulir di bawah ini dengan informasi yang jelas dan valid.
                  </p>
                </div>

                @if (rateLimited()) {
                  <div class="alert alert-warning mb-lg">
                    <app-icon name="alert-triangle" [size]="20" />
                    <div>
                      <strong>Terlalu Banyak Permintaan</strong>
                      <div>Anda telah mencapai batas pengiriman pesan (5 pesan / 10 menit). Silakan coba lagi beberapa saat lagi.</div>
                    </div>
                  </div>
                }

                <form [formGroup]="form" (ngSubmit)="onSubmit()">
                  <div class="form-row-2">
                    <div class="form-group">
                      <label class="form-label" for="senderName">
                        Nama Lengkap <span class="text-danger">*</span>
                      </label>
                      <input
                        id="senderName"
                        type="text"
                        class="form-control"
                        [class.is-invalid]="hasError('senderName')"
                        formControlName="senderName"
                        placeholder="Contoh: Muhammad Fatih"
                        maxlength="100"
                      />
                      @if (hasError('senderName')) {
                        <div class="form-error">Nama wajib diisi (minimal 3 karakter).</div>
                      }
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="email">
                        Alamat Email <span class="text-danger">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        class="form-control"
                        [class.is-invalid]="hasError('email')"
                        formControlName="email"
                        placeholder="contoh@email.com"
                        maxlength="255"
                      />
                      @if (hasError('email')) {
                        <div class="form-error">Alamat email tidak valid.</div>
                      }
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="subject">
                      Subjek / Topik Pesan <span class="text-danger">*</span>
                    </label>
                    <input
                      id="subject"
                      type="text"
                      class="form-control"
                      [class.is-invalid]="hasError('subject')"
                      formControlName="subject"
                      placeholder="Contoh: Kerja Sama Dakwah Kampus / Pertanyaan Muktamar"
                      maxlength="200"
                    />
                    @if (hasError('subject')) {
                      <div class="form-error">Subjek wajib diisi (minimal 5 karakter).</div>
                    }
                  </div>

                  <div class="form-group">
                    <div class="label-with-counter">
                      <label class="form-label" for="message">
                        Isi Pesan <span class="text-danger">*</span>
                      </label>
                      <span class="char-counter" [class.counter-limit]="charCount() >= 950">
                        {{ charCount() }} / 1000
                      </span>
                    </div>
                    <textarea
                      id="message"
                      class="form-control message-textarea"
                      [class.is-invalid]="hasError('message')"
                      formControlName="message"
                      rows="6"
                      placeholder="Tuliskan pesan, pertanyaan, atau detail kolaborasi Anda di sini secara lengkap..."
                      maxlength="1000"
                    ></textarea>
                    @if (hasError('message')) {
                      <div class="form-error">Pesan wajib diisi (minimal 10 karakter).</div>
                    }
                  </div>

                  <div class="form-submit-wrap">
                    <button
                      type="submit"
                      class="btn btn-primary submit-btn"
                      [disabled]="repo.submitting() || rateLimited()"
                    >
                      @if (repo.submitting()) {
                        <div class="spinner spinner-sm mr-xs"></div> Mengirim...
                      } @else {
                        <app-icon name="send" [size]="16" class="mr-xs" /> Kirim Pesan
                      }
                    </button>
                  </div>
                </form>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    /* ---------- Ilustrasi hero: "Jaringan Pesan" — amplop sebagai hub tempat
       pesan dari jaringan LDK se-Indonesia berkumpul, garis "digambar sendiri"
       saat load (animateMsgLines()), simpul berdenyut pakai kelas global
       .network-node/.network-ping (styles.scss) yang sudah jadi primitif
       "Peta Silaturahmi" di seluruh app — dipakai ulang di sini supaya bahasa
       visualnya konsisten dengan Beranda/Struktur/Galeri. ---------- */
    .hero-message-hub { position: relative; width: 100%; }
    .msg-svg { position: relative; z-index: 1; width: 100%; height: 240px; overflow: visible; }

    .msg-envelope-silhouette {
      transform-box: fill-box; transform-origin: 50% 100%; opacity: 0;
      animation: envelopeGrow .9s cubic-bezier(.34,1.4,.64,1) forwards;
      filter: drop-shadow(0 10px 18px rgba(0,147,59,.22));
    }
    @keyframes envelopeGrow { from { opacity: 0; transform: scale(.75) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .msg-envelope-body { fill: url(#msgEnvelopeFill); }
    .msg-envelope-flap { fill: none; stroke: var(--color-primary-dark); stroke-width: 3.4; stroke-linecap: round; stroke-linejoin: round; }
    .msg-ground-shadow { fill: var(--color-primary-dark); opacity: .14; }
    @media (prefers-reduced-motion: reduce) { .msg-envelope-silhouette { animation: none; opacity: 1; transform: none; } }

    .msg-line { fill: none; stroke: var(--color-primary); stroke-width: 1.8; stroke-linecap: round; opacity: .55; }
    .msg-line.thick { stroke-width: 2.6; opacity: .75; stroke: var(--color-primary-bright); }
    .msg-tier { opacity: 0; animation: msgTierFadeIn .4s ease-out forwards; }
    .msg-tier-0 { animation-delay: .75s; }
    .msg-tier-1 { animation-delay: 1.3s; }
    .msg-tier-2 { animation-delay: 1.8s; }
    @keyframes msgTierFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .msg-sent-badge {
      transform-box: fill-box; transform-origin: center; opacity: 0;
      animation: messageSentPop .5s cubic-bezier(.34,1.4,.64,1) 2.2s forwards;
    }
    @keyframes messageSentPop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: scale(1); } }
    @media (prefers-reduced-motion: reduce) { .msg-tier, .msg-sent-badge { animation: none; opacity: 1; transform: none; } }

    /* ---------- Canvas transisi hero -> konten (identik Galeri/Struktur):
       blob gradien bergeser pelan di belakang + fade-mask 70px atas/bawah yang
       menyatukan tepi gelombang hero dengan latar section ini, supaya tak ada
       "garis sambungan" terlihat. ---------- */
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
    @media (prefers-reduced-motion: reduce) {
      .section-blob-drift::before { animation: none; }
    }

    .contact-grid {
      display: grid;
      grid-template-columns: 1fr 1.35fr;
      gap: 32px;
      align-items: start;
      padding-top: 8px;
    }

    @media (max-width: 960px) {
      .contact-grid { grid-template-columns: 1fr; }
    }

    /* Left Column Styling */
    .info-card {
      padding: 32px;
    }

    .info-items { display: flex; flex-direction: column; gap: 20px; }
    .info-item { display: flex; align-items: flex-start; gap: 14px; }

    .item-content { display: flex; flex-direction: column; gap: 3px; padding-top: 2px; }
    .item-label { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-muted); }
    .item-value { font-size: 0.95rem; color: var(--color-text); line-height: 1.45; }
    .item-link { font-size: 0.95rem; color: var(--color-primary); font-weight: 600; text-decoration: none; transition: color var(--motion-fast); }
    .item-link:hover { color: var(--color-primary-dark); text-decoration: underline; }

    .info-divider { border: 0; border-top: 1px solid var(--color-border); margin: 24px 0 20px; }

    .social-section { display: flex; flex-direction: column; gap: 10px; }
    .social-title { font-size: 0.84rem; font-weight: 600; color: var(--color-text-secondary); }
    .social-links { display: flex; flex-wrap: wrap; gap: 8px; }

    .social-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      background: var(--color-bg-alt);
      color: var(--color-text);
      font-size: 0.82rem;
      font-weight: 600;
      text-decoration: none;
      transition: all var(--motion-fast) ease;
    }
    .social-badge:hover {
      background: var(--color-primary-soft);
      color: var(--color-primary-dark);
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .notice-card {
      margin-top: 20px;
      padding: 20px 24px;
      background: #f0fdf4;
      border-color: #bbf7d0;
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }

    .notice-text strong { display: block; font-size: 0.92rem; color: #166534; margin-bottom: 2px; }
    .notice-text p { margin: 0; font-size: 0.85rem; color: #15803d; line-height: 1.4; }

    .newsletter-card { margin-top: 20px; padding: 24px; }
    .newsletter-card-header { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 16px; }
    .newsletter-card-header strong { display: block; font-size: 0.95rem; color: var(--color-text); margin-bottom: 2px; }
    .newsletter-card-header p { margin: 0; font-size: 0.85rem; color: var(--color-text-secondary); line-height: 1.4; }

    /* Right Column Styling */
    .form-card {
      padding: 36px;
    }

    .form-card-header { margin-bottom: 28px; }
    .form-card-header h2 { margin: 0; font-size: 1.45rem; font-weight: 800; color: var(--color-text); }
    .form-card-subtitle { margin: 6px 0 0; font-size: 0.92rem; color: var(--color-text-secondary); }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 640px) {
      .form-row-2 { grid-template-columns: 1fr; gap: 0; }
      .form-card { padding: 24px; }
    }

    .form-group { margin-bottom: 20px; }
    .form-label { display: block; font-weight: 700; font-size: 0.88rem; margin-bottom: 8px; color: var(--color-text); }

    .form-control {
      width: 100%;
      padding: 11px 14px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 0.95rem;
      color: var(--color-text);
      background: #fff;
      transition: border-color var(--motion-fast), box-shadow var(--motion-fast);
      outline: none;
      box-sizing: border-box;
    }
    .form-control:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }
    .form-control.is-invalid {
      border-color: var(--color-danger);
      background-color: #fffbfa;
    }

    .message-textarea { resize: vertical; min-height: 140px; font-family: inherit; }

    .label-with-counter {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .label-with-counter .form-label { margin-bottom: 0; }
    .char-counter { font-size: 0.78rem; font-weight: 600; color: var(--color-muted); }
    .char-counter.counter-limit { color: var(--color-danger); }

    .form-error {
      color: var(--color-danger);
      font-size: 0.8rem;
      margin-top: 5px;
      font-weight: 500;
    }

    .form-submit-wrap {
      margin-top: 28px;
      display: flex;
      justify-content: flex-end;
    }

    .submit-btn {
      padding: 12px 28px;
      font-size: 0.95rem;
      font-weight: 700;
      border-radius: var(--radius-full);
      box-shadow: 0 4px 14px rgba(0, 147, 59, 0.25);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
    }

    /* Success Screen */
    .success-screen {
      padding: 40px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .success-icon-wrap {
      margin-bottom: 16px;
      animation: popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .success-screen h2 { margin: 0 0 8px; font-size: 1.5rem; color: var(--color-text); }
    .success-text { max-width: 440px; color: var(--color-text-secondary); line-height: 1.5; font-size: 0.95rem; }

    .alert-warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
      padding: 14px 18px;
      border-radius: var(--radius-sm);
      display: flex;
      gap: 12px;
      align-items: flex-start;
      font-size: 0.88rem;
    }

    @keyframes popIn {
      from { transform: scale(0.6); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `],
})
export class ContactPublicIndexPage implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  repo = inject(ContactRepository);
  private toast = inject(ToastService);
  private settingApi = inject(SettingApiService);

  /** Default sama dengan migration 0041_contact_email_setting — dipakai
   *  selagi menunggu GET /public/settings/contact-email. */
  contactEmail = signal('fsldkindonesia29@gmail.com');

  /** Default digit internasional (tanpa "+") sama dengan nomor yang sebelumnya
   *  hardcoded — dipakai selagi menunggu GET /public/settings/contact-whatsapp. */
  whatsappNumber = signal('6285111332861');
  whatsappDisplay = computed(() => {
    const digits = this.whatsappNumber();
    if (!digits) return '';
    const m = digits.match(/^(\d{2})(\d{3})(\d{4})(\d+)$/);
    return m ? `+${m[1]} ${m[2]}-${m[3]}-${m[4]}` : `+${digits}`;
  });

  submittedSuccess = signal<boolean>(false);
  rateLimited = signal<boolean>(false);
  submitTried = signal<boolean>(false);

  form = this.fb.group({
    senderName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  });

  @ViewChildren('msgLine') private msgLineRefs!: QueryList<ElementRef<SVGPathElement>>;

  constructor() {
    this.settingApi.getPublicContactEmail().subscribe({
      next: (res) => { if (res.email) this.contactEmail.set(res.email); },
      error: () => {},
    });
    this.settingApi.getPublicContactWhatsapp().subscribe({
      next: (res) => { if (res.whatsappNumber) this.whatsappNumber.set(res.whatsappNumber); },
      error: () => {},
    });
  }

  ngAfterViewInit(): void {
    this.animateMsgLines();
  }

  ngOnDestroy(): void {}

  /** Efek "jaringan digambar sendiri" — identik animateOrgLines() di Struktur:
   *  stroke di-dash sepanjang total panjang path (getTotalLength()) lalu
   *  dashoffset dianimasikan lewat Web Animations API, digilir per-garis
   *  mengikuti urutan hierarki (amplop->hub daerah dulu, baru hub->LDK).
   *  Menghormati prefers-reduced-motion — langsung tampil penuh tanpa animasi. */
  private animateMsgLines(): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.msgLineRefs?.forEach((ref, i) => {
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

  charCount(): number {
    return (this.form.value.message || '').length;
  }

  hasError(field: 'senderName' | 'email' | 'subject' | 'message'): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.touched || this.submitTried()));
  }

  onSubmit(): void {
    this.submitTried.set(true);
    if (this.form.invalid) {
      this.toast.error('Mohon lengkapi seluruh field dengan benar.');
      return;
    }

    const payload = {
      senderName: this.form.value.senderName!.trim(),
      email: this.form.value.email!.trim(),
      subject: this.form.value.subject!.trim(),
      message: this.form.value.message!.trim(),
    };

    this.repo.sendPublic(payload).subscribe({
      next: () => {
        this.submittedSuccess.set(true);
        this.rateLimited.set(false);
        this.toast.success('Pesan Anda berhasil dikirim!');
      },
      error: (err) => {
        if (err.status === 429) {
          this.rateLimited.set(true);
          this.toast.warning('Terlalu banyak permintaan pengiriman pesan. Coba lagi beberapa saat lagi.');
        } else {
          this.toast.error(err.error?.message || 'Gagal mengirim pesan. Silakan coba kembali.');
        }
      },
    });
  }

  resetForm(): void {
    this.form.reset();
    this.submitTried.set(false);
    this.submittedSuccess.set(false);
  }
}
