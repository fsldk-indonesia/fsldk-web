import { Component, HostListener, Input, inject, output, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { UploadService } from '../core/services/upload.service';
import { ToastService } from '../core/services/toast.service';
import { IconComponent } from './icon.component';
import { ModalBackdropDirective } from './modal-backdrop.directive';

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
  imports: [IconComponent, ModalBackdropDirective],
  template: `
    <input #fileInput type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden (change)="onFilesSelected($event)">

    @if (value.length) {
      <div class="gallery-grid">
        @for (url of value; track url; let i = $index) {
          <div class="gallery-item">
            <img [src]="url" alt="Gambar produk {{ i + 1 }}" (click)="openLightbox(i)">
            <span class="gallery-order">{{ i + 1 }}</span>
            @if (!disabled) {
              <div class="gallery-actions">
                <button type="button" class="gallery-btn" [disabled]="i === 0" title="Pindah ke kiri" (click)="move(i, -1); $event.stopPropagation()"><i class="fas fa-arrow-left"></i></button>
                <button type="button" class="gallery-btn" [disabled]="i === value.length - 1" title="Pindah ke kanan" (click)="move(i, 1); $event.stopPropagation()"><i class="fas fa-arrow-right"></i></button>
                <button type="button" class="gallery-btn danger" title="Hapus" (click)="removeAt(i); $event.stopPropagation()"><i class="fas fa-trash-can"></i></button>
              </div>
            }
          </div>
        }
      </div>
    }

    @if (value.length < max && !disabled) {
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

    <!-- Lightbox — pola & alasan sama persis seperti app-image-upload
         (selalu ter-mount saat ada value supaya transisi tutup juga
         kelihatan), ditambah navigasi prev/next karena gallery ini
         menampung banyak gambar sekaligus. -->
    @if (value.length) {
      <div class="lightbox-backdrop" [class.open]="lightboxOpen()" appModalBackdrop [dismissible]="true" (backdropClose)="closeLightbox()">
        <button type="button" class="lightbox-close" (click)="closeLightbox()" aria-label="Tutup"><app-icon name="x" [size]="18" /></button>
        @if (value.length > 1) {
          <button type="button" class="lightbox-nav lightbox-nav-prev" (click)="prevLightbox($event)" aria-label="Sebelumnya"><app-icon name="chevron-left" [size]="20" /></button>
        }
        <img [src]="value[lightboxIndex()]" alt="Gambar produk {{ lightboxIndex() + 1 }}" class="lightbox-img" (click)="$event.stopPropagation()">
        @if (value.length > 1) {
          <button type="button" class="lightbox-nav lightbox-nav-next" (click)="nextLightbox($event)" aria-label="Selanjutnya"><app-icon name="chevron-right" [size]="20" /></button>
          <span class="lightbox-counter">{{ lightboxIndex() + 1 }} / {{ value.length }}</span>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-bottom: 12px; }
    .gallery-item { position: relative; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; aspect-ratio: 1 / 1; background: var(--color-bg-warm); }
    .gallery-item img { width: 100%; height: 100%; object-fit: cover; display: block; cursor: zoom-in; }
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

    /* Lightbox — background rgba(0,0,0,.85) tanpa blur, sama persis seperti
       app-image-upload/Pesan Kontak/Foto Sampul (lihat catatan di
       gallery-lightbox.component.ts soal kenapa blur dihindari). */
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
    .lightbox-nav {
      position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; border: none;
      background: rgba(255,255,255,.15); color: #fff; cursor: pointer;
      transition: background var(--motion-fast) ease;
    }
    .lightbox-nav:hover { background: rgba(255,255,255,.3); }
    .lightbox-nav-prev { left: 20px; }
    .lightbox-nav-next { right: 20px; }
    .lightbox-counter {
      position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
      font-size: .82rem; font-weight: 700; color: #fff; background: rgba(0,0,0,.5);
      padding: 4px 12px; border-radius: 999px;
    }
  `],
})
export class MultiImageUploadComponent {
  @Input() value: string[] = [];
  @Input() max = 10;
  @Input() disabled = false;
  readonly valueChange = output<string[]>();

  private uploadService = inject(UploadService);
  private toast = inject(ToastService);

  uploading = signal(false);
  lightboxOpen = signal(false);
  lightboxIndex = signal(0);

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.lightboxOpen()) return;
    if (event.key === 'Escape') this.closeLightbox();
    else if (event.key === 'ArrowLeft') this.prevLightbox();
    else if (event.key === 'ArrowRight') this.nextLightbox();
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void { this.lightboxOpen.set(false); }

  prevLightbox(event?: Event): void {
    event?.stopPropagation();
    this.lightboxIndex.set((this.lightboxIndex() - 1 + this.value.length) % this.value.length);
  }

  nextLightbox(event?: Event): void {
    event?.stopPropagation();
    this.lightboxIndex.set((this.lightboxIndex() + 1) % this.value.length);
  }

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
