import { Component, Input, inject, output, signal } from '@angular/core';
import { UploadService } from '../core/services/upload.service';
import { ToastService } from '../core/services/toast.service';

/**
 * Input berkas dokumen berbasis unggah langsung — dipakai oleh form Artikel
 * CMS (naskah PDF) dan field FILE_DOCUMENT submission (pdf/docx/xlsx, OQ-07).
 * Mengunggah ke POST /uploads/document lalu memancarkan URL hasil unggahan
 * lewat `[(value)]`.
 */
@Component({
  selector: 'app-pdf-upload',
  standalone: true,
  template: `
    <input #fileInput type="file" [attr.accept]="accept" hidden (change)="onFileSelected($event)">

    @if (value) {
      <div class="pdf-chip">
        <span class="pdf-icon">📄</span>
        <a [href]="value" target="_blank" rel="noopener" class="pdf-name">Lihat berkas saat ini</a>
        <div class="pdf-actions">
          <button type="button" class="btn btn-outline btn-sm" (click)="fileInput.click()" [disabled]="uploading()">Ganti Berkas</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="remove()" [disabled]="uploading()">Hapus</button>
        </div>
        @if (uploading()) { <div class="pdf-overlay"><span class="spinner spinner-dark"></span></div> }
      </div>
    } @else {
      <button type="button" class="dropzone" (click)="fileInput.click()" [disabled]="uploading()">
        @if (uploading()) {
          <span class="spinner spinner-dark"></span><span>Mengunggah…</span>
        } @else {
          <span class="dropzone-icon">&#8593;</span>
          <span>Klik untuk unggah {{ label }}</span>
          <small>Format {{ allowedExtensions.join('/') }} — maks. {{ maxSizeMB }}MB</small>
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
    .pdf-chip { position: relative; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; flex-wrap: wrap; }
    .pdf-icon { font-size: 1.3rem; }
    .pdf-name { font-weight: 600; }
    .pdf-actions { display: flex; gap: 8px; margin-left: auto; }
    .pdf-overlay { position: absolute; inset: 0; background: rgba(255,255,255,.75); display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); }
  `],
})
export class PdfUploadComponent {
  @Input() value: string | null = null;
  /** Ekstensi yang diterima (dipakai untuk validasi & atribut `accept`).
   *  Default PDF saja — form Artikel CMS tetap seperti semula; field dokumen
   *  submission (OQ-07) melewatkan set yang lebih luas (pdf/docx/xlsx). */
  @Input() allowedExtensions: string[] = ['.pdf'];
  @Input() maxSizeMB = 20;
  @Input() label = 'PDF';
  readonly valueChange = output<string>();

  private uploadService = inject(UploadService);
  private toast = inject(ToastService);

  uploading = signal(false);

  get accept(): string { return this.allowedExtensions.join(','); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;

    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
    if (!this.allowedExtensions.includes(ext)) {
      this.toast.error(`Format berkas tidak didukung (hanya ${this.allowedExtensions.join(', ')})`);
      return;
    }
    const maxBytes = this.maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      this.toast.error(`Ukuran berkas melebihi ${this.maxSizeMB}MB`);
      return;
    }

    this.uploading.set(true);
    this.uploadService.uploadDocument(file).subscribe({
      next: (res) => {
        this.uploading.set(false);
        this.value = res.url;
        this.valueChange.emit(res.url);
      },
      error: () => this.uploading.set(false),
    });
  }

  remove(): void {
    this.value = null;
    this.valueChange.emit('');
  }
}
