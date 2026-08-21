import { Component, Input, inject, output, signal } from '@angular/core';
import { UploadService } from '../core/services/upload.service';
import { ToastService } from '../core/services/toast.service';

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
  template: `
    <input #fileInput type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden (change)="onFileSelected($event)">

    @if (value) {
      <div class="preview">
        <img [src]="value" alt="Pratinjau gambar">
        <div class="preview-actions">
          <button type="button" class="btn btn-outline btn-sm" (click)="fileInput.click()" [disabled]="uploading()">Ganti Gambar</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="remove()" [disabled]="uploading()">Hapus</button>
        </div>
        @if (uploading()) { <div class="preview-overlay"><span class="spinner spinner-dark"></span></div> }
      </div>
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
  `,
  styles: [`
    :host { display: block; }
    .dropzone { width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 28px 16px; border: 1.5px dashed var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-warm); color: var(--color-text-secondary); font-family: var(--font-body); font-size: .92rem; font-weight: 600; cursor: pointer; }
    .dropzone:hover { border-color: var(--color-primary); color: var(--color-primary-dark); }
    .dropzone-icon { font-size: 1.3rem; line-height: 1; }
    .dropzone small { font-weight: 400; color: var(--color-muted); }
    .preview { position: relative; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
    .preview img { width: 100%; max-height: 260px; object-fit: cover; display: block; }
    .preview-actions { display: flex; gap: 8px; padding: 10px; background: #fff; }
    .preview-overlay { position: absolute; inset: 0; background: rgba(255,255,255,.75); display: flex; align-items: center; justify-content: center; }
  `],
})
export class ImageUploadComponent {
  @Input() value: string | null = null;
  readonly valueChange = output<string>();

  private uploadService = inject(UploadService);
  private toast = inject(ToastService);

  uploading = signal(false);

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
