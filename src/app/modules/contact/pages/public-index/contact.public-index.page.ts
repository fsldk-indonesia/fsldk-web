import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ContactRepository } from '../../repositories/contact.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { IconComponent } from '../../../../shared/icon.component';

/**
 * Public Contact Us page with official organization contacts and interactive inquiry form.
 */
@Component({
  selector: 'app-contact-public-index',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <section class="section">
      <div class="container pb-xl">
        <!-- Hero Header -->
        <div class="text-center page-header">
          <span class="eyebrow">Tentang Kami</span>
          <h1>Hubungi <span class="text-primary">Kami</span></h1>
          <p class="text-muted page-subtitle">
            Ada pertanyaan, kolaborasi dakwah, atau aspirasi kampus? Kami siap mendengar dan bersinergi bersama Anda.
          </p>
        </div>

        <div class="contact-grid">
          <!-- Left Column: Official Contact Information -->
          <div class="contact-info-col">
            <div class="card info-card">
              <div class="info-items">
                <div class="info-item">
                  <span class="item-icon"><app-icon name="map-pin" [size]="18" /></span>
                  <div class="item-content">
                    <span class="item-label">Alamat</span>
                    <span class="item-value">Plaza Aminta Lantai 5/504 Jl TB Simatupang Kav.10 - Pondok Pinang Kebayoran Lama - Jakarta Selatan 12310</span>
                  </div>
                </div>

                <div class="info-item">
                  <span class="item-icon"><app-icon name="envelope" [size]="18" /></span>
                  <div class="item-content">
                    <span class="item-label">Email Resmi</span>
                    <a href="mailto:info@fsldkindonesia.org" class="item-link">info&#64;fsldkindonesia.org</a>
                  </div>
                </div>

                <div class="info-item">
                  <span class="item-icon"><app-icon name="whatsapp" [size]="18" /></span>
                  <div class="item-content">
                    <span class="item-label">WhatsApp</span>
                    <a href="https://wa.me/6285111332861" target="_blank" rel="noopener noreferrer" class="item-link">+62 851-1133-2861</a>
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
            <div class="card notice-card">
              <div class="notice-icon"><app-icon name="info" [size]="20" /></div>
              <div class="notice-text">
                <strong>Respons Cepat</strong>
                <p>Setiap pesan yang masuk melalui formulir ini akan diteruskan langsung ke divisi terkait dan dijawab dalam 1x24 jam kerja.</p>
              </div>
            </div>
          </div>

          <!-- Right Column: Interactive Contact Form -->
          <div class="contact-form-col">
            <div class="card form-card">
              @if (submittedSuccess()) {
                <!-- Success State Screen -->
                <div class="success-screen">
                  <div class="success-icon-wrap">
                    <app-icon name="check-circle" [size]="56" />
                  </div>
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
    /* Wash gradien hijau khas FSLDK di bagian atas halaman (konsisten dengan halaman berita, artikel, event, galeri, struktur, dll.) */
    .section {
      background: linear-gradient(180deg, var(--color-primary-soft) 0%, var(--color-primary-tint) 220px, #fff 520px);
      min-height: 85vh;
      padding-top: 48px;
    }

    .page-header { margin-bottom: 48px; }
    .page-header h1 {
      font-size: clamp(2rem, 4vw, 2.75rem);
      font-weight: 800;
      color: var(--color-text);
      margin: 6px 0 10px;
      letter-spacing: -0.02em;
    }
    .page-subtitle { max-width: 620px; margin: 0 auto; font-size: 1.05rem; }

    .contact-grid {
      display: grid;
      grid-template-columns: 1fr 1.35fr;
      gap: 32px;
      align-items: start;
    }

    @media (max-width: 960px) {
      .contact-grid { grid-template-columns: 1fr; }
    }

    /* Left Column Styling */
    .info-card {
      padding: 32px;
      border-radius: var(--radius-lg);
      background: #fff;
      border: 1px solid var(--color-border);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
    }

    .info-card-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .badge-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: var(--color-primary-soft);
      color: var(--color-primary-dark);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .info-card-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--color-text); }
    .info-card-desc { margin: 2px 0 0; font-size: 0.88rem; color: var(--color-text-secondary); }

    .info-items { display: flex; flex-direction: column; gap: 20px; }
    .info-item { display: flex; align-items: flex-start; gap: 14px; }
    
    .item-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: var(--color-bg-alt);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .item-content { display: flex; flex-direction: column; gap: 3px; }
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
      transform: translateY(-1px);
    }

    .notice-card {
      margin-top: 20px;
      padding: 20px 24px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: var(--radius-md);
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }

    .notice-icon { color: #16a34a; flex-shrink: 0; margin-top: 2px; }
    .notice-text strong { display: block; font-size: 0.92rem; color: #166534; margin-bottom: 2px; }
    .notice-text p { margin: 0; font-size: 0.85rem; color: #15803d; line-height: 1.4; }

    /* Right Column Styling */
    .form-card {
      padding: 36px;
      border-radius: var(--radius-lg);
      background: #fff;
      border: 1px solid var(--color-border);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
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
      box-shadow: 0 0 0 3px rgba(0, 147, 59, 0.12);
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
      color: #16a34a;
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
export class ContactPublicIndexPage implements OnInit {
  private fb = inject(FormBuilder);
  repo = inject(ContactRepository);
  private toast = inject(ToastService);
  private title = inject(Title);

  submittedSuccess = signal<boolean>(false);
  rateLimited = signal<boolean>(false);
  submitTried = signal<boolean>(false);

  form = this.fb.group({
    senderName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    this.title.setTitle('Hubungi Kami — FSLDK Indonesia');
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
