import { Component, Input, inject, output, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { UploadService } from '../core/services/upload.service';
import { ToastService } from '../core/services/toast.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Input gallery multi-gambar — pola sama seperti `app-image-upload` (unggah
 * langsung ke POST /uploads/image via UploadService, bukan mekanisme baru)
 * tapi menampung array URL dengan preview grid, hapus per-gambar, dan
 * reorder (menentukan `sortOrder` saat disimpan). Dipakai form produk goods.
 */
@Component({
  selector: 'app-multi-image-upload',
  standalone: true,
  template: `
    <input #fileInput type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden (change)="onFilesSelected($event)">

    @if (value.length) {
      <div class="gallery-grid">
        @for (url of value; track url; let i = $index) {
          <div class="gallery-item">
            <img [src]="url" alt="Gambar produk {{ i + 1 }}">
            <span class="gallery-order">{{ i + 1 }}</span>
            <div class="gallery-actions">
              <button type="button" class="gallery-btn" [disabled]="i === 0" title="Pindah ke kiri" (click)="move(i, -1)"><i class="fas fa-arrow-left"></i></button>
              <button type="button" class="gallery-btn" [disabled]="i === value.length - 1" title="Pindah ke kanan" (click)="move(i, 1)"><i class="fas fa-arrow-right"></i></button>
              <button type="button" class="gallery-btn danger" title="Hapus" (click)="removeAt(i)"><i class="fas fa-trash-can"></i></button>
            </div>
          </div>
        }
      </div>
    }

    @if (value.length < max) {
      <button type="button" class="dropzone" (click)="fileInput.click()" [disabled]="uploading()">
        @if (uploading()) {
          <span class="spinner spinner-dark"></span><span>Mengunggah…</span>
        } @else {
          <span class="dropzone-icon">&#8593;</span>
          <span>Klik untuk unggah gambar ({{ value.length }}/{{ max }})</span>
          <small>JPG, PNG, WEBP, atau GIF — maks. 5MB per berkas</small>
        }
      </button>
    }
  `,
  styles: [`
    :host { display: block; }
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-bottom: 12px; }
    .gallery-item { position: relative; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; aspect-ratio: 1 / 1; background: var(--color-bg-warm); }
    .gallery-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .gallery-order { position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,.6); color: #fff; font-size: .72rem; font-weight: 700; padding: 2px 7px; border-radius: 999px; }
    .gallery-actions { position: absolute; inset: auto 0 0 0; display: flex; gap: 4px; padding: 6px; background: linear-gradient(to top, rgba(0,0,0,.55), transparent); opacity: 0; transition: opacity var(--motion-fast) ease; }
    .gallery-item:hover .gallery-actions, .gallery-item:focus-within .gallery-actions { opacity: 1; }
    .gallery-btn { flex: 1; display: flex; align-items: center; justify-content: center; padding: 5px; border: none; border-radius: var(--radius-xs); background: rgba(255,255,255,.92); color: var(--color-text); font-size: .78rem; cursor: pointer; }
    .gallery-btn:hover { background: #fff; }
    .gallery-btn:disabled { opacity: .4; cursor: not-allowed; }
    .gallery-btn.danger { color: #c0392b; }
    .dropzone { width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 22px 16px; border: 1.5px dashed var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-warm); color: var(--color-text-secondary); font-family: var(--font-body); font-size: .92rem; font-weight: 600; cursor: pointer; }
    .dropzone:hover { border-color: var(--color-primary); color: var(--color-primary-dark); }
    .dropzone-icon { font-size: 1.3rem; line-height: 1; }
    .dropzone small { font-weight: 400; color: var(--color-muted); }
  `],
})
export class MultiImageUploadComponent {
  @Input() value: string[] = [];
  @Input() max = 10;
  readonly valueChange = output<string[]>();

  private uploadService = inject(UploadService);
  private toast = inject(ToastService);

  uploading = signal(false);

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;

    const remaining = this.max - this.value.length;
    if (files.length > remaining) {
      this.toast.error(`Maksimal ${this.max} gambar — hanya ${remaining} slot tersisa`);
      return;
    }
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        this.toast.error(`Format berkas tidak didukung: ${file.name}`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        this.toast.error(`Ukuran berkas melebihi 5MB: ${file.name}`);
        return;
      }
    }

    this.uploading.set(true);
    forkJoin(files.map((f) => this.uploadService.uploadImage(f))).subscribe({
      next: (results) => {
        this.uploading.set(false);
        this.valueChange.emit([...this.value, ...results.map((r) => r.url)]);
      },
      error: () => this.uploading.set(false),
    });
  }

  move(index: number, delta: number): void {
    const target = index + delta;
    if (target < 0 || target >= this.value.length) return;
    const next = [...this.value];
    [next[index], next[target]] = [next[target], next[index]];
    this.valueChange.emit(next);
  }

  removeAt(index: number): void {
    this.valueChange.emit(this.value.filter((_, i) => i !== index));
  }
}
