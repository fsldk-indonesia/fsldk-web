import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryPhoto } from '../../entities/gallery';
import { IconComponent } from '../../../../shared/icon.component';
import { environment } from '../../../../../environments/environment';

/**
 * Fullscreen accessible lightbox component for displaying gallery images.
 */
@Component({
  selector: 'app-gallery-lightbox',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (isOpen) {
      <div
        class="lightbox-overlay"
        (click)="onBackdropClick($event)"
        role="dialog"
        aria-modal="true"
        aria-label="Penampil Foto"
      >
        <!-- Top bar with counter, title and close button -->
        <div class="lightbox-topbar" (click)="$event.stopPropagation()">
          <div class="lightbox-info">
            <span class="lightbox-counter">{{ currentIndex() + 1 }} / {{ photos.length }}</span>
            @if (galleryTitle) {
              <span class="lightbox-title">{{ galleryTitle }}</span>
            }
          </div>
          <button
            type="button"
            class="lightbox-btn-close"
            (click)="onClose()"
            aria-label="Tutup"
            title="Tutup (Esc)"
          >
            <app-icon name="x" [size]="20" />
          </button>
        </div>

        <!-- Navigation: Previous -->
        @if (photos.length > 1) {
          <button
            type="button"
            class="lightbox-nav lightbox-nav-prev"
            (click)="prev($event)"
            aria-label="Foto Sebelumnya"
            title="Sebelumnya (Panah Kiri)"
          >
            <app-icon name="chevron-left" [size]="24" />
          </button>
        }

        <!-- Main Image Container -->
        <div
          class="lightbox-stage"
          (click)="$event.stopPropagation()"
          (touchstart)="onTouchStart($event)"
          (touchend)="onTouchEnd($event)"
        >
          @if (currentPhoto(); as photo) {
            <div class="lightbox-img-wrapper">
              <img
                [src]="imgUrl(photo.imagePath)"
                [alt]="photo.caption || 'Foto Galeri ' + (currentIndex() + 1)"
                class="lightbox-img"
              />
            </div>

            @if (photo.caption) {
              <div class="lightbox-caption">
                <p>{{ photo.caption }}</p>
              </div>
            }
          }
        </div>

        <!-- Navigation: Next -->
        @if (photos.length > 1) {
          <button
            type="button"
            class="lightbox-nav lightbox-nav-next"
            (click)="next($event)"
            aria-label="Foto Selanjutnya"
            title="Selanjutnya (Panah Kanan)"
          >
            <app-icon name="chevron-right" [size]="24" />
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .lightbox-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(10, 15, 25, 0.94);
      backdrop-filter: blur(12px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
      user-select: none;
    }

    .lightbox-topbar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 28px;
      z-index: 10;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
    }

    .lightbox-info {
      display: flex;
      align-items: center;
      gap: 16px;
      color: #fff;
    }

    .lightbox-counter {
      font-size: 0.85rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      letter-spacing: 0.05em;
    }

    .lightbox-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.85);
      max-width: 480px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .lightbox-btn-close {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .lightbox-btn-close:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: scale(1.05);
    }

    .lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .lightbox-nav:hover {
      background: rgba(255, 255, 255, 0.28);
      transform: translateY(-50%) scale(1.08);
    }

    .lightbox-nav-prev {
      left: 24px;
    }

    .lightbox-nav-next {
      right: 24px;
    }

    .lightbox-stage {
      position: relative;
      max-width: 90vw;
      max-height: 82vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px;
    }

    .lightbox-img-wrapper {
      max-width: 100%;
      max-height: 72vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .lightbox-img {
      max-width: 100%;
      max-height: 72vh;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      animation: zoomIn 0.22s ease-out;
    }

    .lightbox-caption {
      margin-top: 14px;
      max-width: 720px;
      padding: 10px 20px;
      background: rgba(0, 0, 0, 0.55);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: #fff;
      text-align: center;
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .lightbox-caption p {
      margin: 0;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes zoomIn {
      from { opacity: 0.8; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    @media (max-width: 768px) {
      .lightbox-nav {
        width: 42px;
        height: 42px;
      }
      .lightbox-nav-prev { left: 10px; }
      .lightbox-nav-next { right: 10px; }
      .lightbox-title { display: none; }
      .lightbox-topbar { padding: 12px 16px; }
      .lightbox-img { max-height: 65vh; }
    }
  `],
})
export class GalleryLightboxComponent {
  @Input() photos: GalleryPhoto[] = [];
  @Input() set initialIndex(val: number) {
    if (val >= 0 && val < this.photos.length) {
      this.currentIndex.set(val);
    }
  }
  @Input() isOpen = false;
  @Input() galleryTitle = '';

  @Output() close = new EventEmitter<void>();

  currentIndex = signal<number>(0);

  currentPhoto = computed(() => {
    const list = this.photos;
    const idx = this.currentIndex();
    return list && list.length > idx ? list[idx] : null;
  });

  private touchStartX = 0;

  constructor() {
    // Sync index when photos change or lightbox opens
    effect(() => {
      const idx = this.currentIndex();
      if (this.photos.length > 0 && idx >= this.photos.length) {
        this.currentIndex.set(this.photos.length - 1);
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen) return;
    if (event.key === 'Escape') {
      this.onClose();
    } else if (event.key === 'ArrowLeft') {
      this.prev();
    } else if (event.key === 'ArrowRight') {
      this.next();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  next(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (this.photos.length <= 1) return;
    const nextIdx = (this.currentIndex() + 1) % this.photos.length;
    this.currentIndex.set(nextIdx);
  }

  prev(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (this.photos.length <= 1) return;
    const prevIdx = (this.currentIndex() - 1 + this.photos.length) % this.photos.length;
    this.currentIndex.set(prevIdx);
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent): void {
    const touchEndX = event.changedTouches[0].screenX;
    const diff = touchEndX - this.touchStartX;
    // 50px threshold for swipe detection
    if (diff < -50) {
      this.next();
    } else if (diff > 50) {
      this.prev();
    }
  }

  imgUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    if (path.startsWith('/')) {
      return `${base}${path}`;
    }
    return `${base}/uploads/${path}`;
  }
}
