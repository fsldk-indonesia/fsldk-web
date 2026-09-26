import { Component, HostListener, Input, inject, output, signal } from '@angular/core';
import { UploadService } from '../core/services/upload.service';
import { ToastService } from '../core/services/toast.service';
import { IconComponent } from './icon.component';
import { ModalBackdropDirective } from './modal-backdrop.directive';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Input gambar berbasis unggah berkas langsung (bukan tempel URL) — dipakai
 * bersama oleh form Artikel & Berita CMS. Mengunggah ke POST /uploads/image
 * lalu memancarkan URL hasil unggahan lewat `[(value)]`.
 */
@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [IconComponent, ModalBackdropDirective],
  template: `
    <input #fileInput type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden (change)="onFileSelected($event)">

    @if (value) {
      <div class="preview">
        <img [src]="value" alt="Pratinjau gambar" class="preview-img" (click)="lightboxOpen.set(true)">
        @if (!disabled) {
          <div class="preview-actions">
            <button type="button" class="btn btn-outline btn-sm" (click)="fileInput.click()" [disabled]="uploading()">Ganti Gambar</button>
            <button type="button" class="btn btn-ghost btn-sm" (click)="remove()" [disabled]="uploading()">Hapus</button>
          </div>
        }
        @if (uploading()) { <div class="preview-overlay"><span class="spinner spinner-dark"></span></div> }
      </div>
    } @else if (disabled) {
      <div class="dropzone dropzone-empty"><span>Tidak ada gambar</span></div>
    } @else {
      <button type="button" class="dropzone" (click)="fileInput.click()" [disabled]="uploading()">
        @if (uploading()) {
          <span class="spinner spinner-dark"></span><span>Mengunggah…</span>
        } @else {
          <span class="dropzone-icon">&#8593;</span>
          <span>Klik untuk unggah gambar</span>
          <small>JPG, PNG, WEBP, atau GIF — maks. 5MB</small>
        }
      </button>
    }

    <!-- Lightbox: klik gambar untuk memperbesar — backdrop TIDAK menutup
         secara default di app ini (lihat ModalBackdropDirective), tapi untuk
         preview gambar (tanpa risiko kehilangan data) klik-luar-untuk-tutup
         masuk akal, jadi dijadikan exception eksplisit lewat [dismissible].
         Selalu di-render saat ada value (bukan @if lightboxOpen()) supaya
         transisi TUTUP juga kelihatan, bukan cuma transisi buka — @if
         langsung mencabut elemen dari DOM begitu ditutup. -->
    @if (value) {
      <div class="lightbox-backdrop" [class.open]="lightboxOpen()" appModalBackdrop [dismissible]="true" (backdropClose)="lightboxOpen.set(false)">
        <button type="button" class="lightbox-close" (click)="lightboxOpen.set(false)" aria-label="Tutup"><app-icon name="x" [size]="18" /></button>
        <img [src]="value" alt="Pratinjau gambar diperbesar" class="lightbox-img" (click)="$event.stopPropagation()">
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .dropzone { width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 28px 16px; border: 1.5px dashed var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-warm); color: var(--color-text-secondary); font-family: var(--font-body); font-size: .92rem; font-weight: 600; cursor: pointer; }
    .dropzone:hover { border-color: var(--color-primary); color: var(--color-primary-dark); }
    .dropzone-icon { font-size: 1.3rem; line-height: 1; }
    .dropzone-empty { cursor: default; color: var(--color-muted); background: var(--color-bg-alt); }
    .dropzone-empty:hover { border-color: var(--color-border); color: var(--color-muted); }
    .dropzone small { font-weight: 400; color: var(--color-muted); }
    .preview { position: relative; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
    .preview-img { width: 100%; max-height: 260px; object-fit: cover; display: block; cursor: zoom-in; }
    .preview-actions { display: flex; gap: 8px; padding: 10px; background: #fff; }
    .preview-overlay { position: absolute; inset: 0; background: rgba(255,255,255,.75); display: flex; align-items: center; justify-content: center; }

    /* Lightbox — klik gambar utama untuk memperbesar penuh layar. Selalu
       ter-mount saat ada value (lihat template); buka/tutup dianimasikan
       lewat opacity+scale, bukan mount/unmount, supaya transisi tutup juga
       kelihatan (bukan cuma transisi buka). */
    .lightbox-backdrop {
      position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.85);
      display: flex; align-items: center; justify-content: center; padding: 40px;
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity .15s ease, visibility 0s linear .15s;
    }
    .lightbox-backdrop.open { opacity: 1; visibility: visible; pointer-events: auto; transition: opacity .15s ease, visibility 0s linear 0s; }
    .lightbox-backdrop .lightbox-img { transform: scale(.96); transition: transform .15s ease; }
    .lightbox-backdrop.open .lightbox-img { transform: scale(1); }
    @media (prefers-reduced-motion: reduce) { .lightbox-backdrop, .lightbox-backdrop .lightbox-img { transition: none; } }
    .lightbox-img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: var(--radius-xs); cursor: default; }
    .lightbox-close {
      position: absolute; top: 20px; right: 24px; width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; border: none;
      background: rgba(255,255,255,.15); color: #fff; cursor: pointer;
      transition: background var(--motion-fast) ease;
    }
    .lightbox-close:hover { background: rgba(255,255,255,.3); }
  `],
})
export class ImageUploadComponent {
  @Input() value: string | null = null;
  @Input() disabled = false;
  readonly valueChange = output<string>();

  private uploadService = inject(UploadService);
  private toast = inject(ToastService);

  uploading = signal(false);
  lightboxOpen = signal(false);

  @HostListener('window:keydown.escape')
  onEscape(): void { this.lightboxOpen.set(false); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.toast.error('Format berkas tidak didukung (hanya JPG, PNG, WEBP, GIF)');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      this.toast.error('Ukuran berkas melebihi 5MB');
      return;
    }

    this.uploading.set(true);
    this.uploadService.uploadImage(file).subscribe({
      next: (res) => {
        this.uploading.set(false);
        // Tidak menyentuh this.value di sini — biarkan @Input() value (milik
        // parent) yang jadi satu-satunya sumber kebenaran tampilan. Kalau
        // langsung dimutasi lokal sebelum parent mengonfirmasi penyimpanan
        // (mis. via [(value)] atau, seperti di halaman Profil Saya, lewat
        // panggilan API terpisah setelah valueChange), dan penyimpanan itu
        // gagal, tampilan akan "nyangkut" di state baru tanpa cara rollback
        // — persis skenario yang bikin foto profil terlihat hilang padahal
        // penghapusannya sendiri ditolak backend.
        this.valueChange.emit(res.url);
      },
      error: () => this.uploading.set(false),
    });
  }

  remove(): void {
    // Sama seperti di atas: jangan optimis set this.value = null di sini.
    // Parent yang mengontrol @Input() value akan mendorong nilai baru turun
    // ke komponen ini setelah penghapusan benar-benar berhasil disimpan.
    this.valueChange.emit('');
  }
}
