import { Component, Input, OnChanges, signal } from '@angular/core';
import { IconComponent } from './icon.component';

/**
 * Gallery gambar produk — main image besar + thumbnail strip di bawahnya,
 * klik thumbnail mengganti main image. Native (tanpa library carousel
 * eksternal), dipakai halaman detail publik FSLDK Goods.
 */
@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="gallery">
      <div class="gallery-main">
        @if (images.length) {
          <img [src]="images[activeIndex()]" [alt]="alt">
        } @else {
          <app-icon name="shopping-bag" [size]="40" />
        }
      </div>
      @if (images.length > 1) {
        <div class="gallery-thumbs">
          @for (img of images; track img; let i = $index) {
            <button type="button" class="gallery-thumb" [class.active]="i === activeIndex()" (click)="select(i)">
              <img [src]="img" [alt]="alt + ' — gambar ' + (i + 1)">
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .gallery-main { aspect-ratio: 1/1; border-radius: var(--radius-lg); border: 1px solid var(--color-border); background: var(--color-primary-soft); box-shadow: var(--shadow); display: flex; align-items: center; justify-content: center; color: var(--color-muted); overflow: hidden; }
    .gallery-main img { width: 100%; height: 100%; object-fit: cover; }
    .gallery-thumbs { display: flex; gap: 10px; margin-top: 12px; overflow-x: auto; padding-bottom: 2px; }
    .gallery-thumb { flex-shrink: 0; width: 68px; height: 68px; padding: 0; border: 2px solid transparent; border-radius: var(--radius-xs); overflow: hidden; cursor: pointer; background: var(--color-bg-warm); box-shadow: var(--shadow-sm); transition: border-color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out); }
    .gallery-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .gallery-thumb:hover { border-color: var(--color-primary-soft); transform: translateY(-2px); }
    .gallery-thumb.active { border-color: var(--color-primary); }
    .gallery-thumb:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
  `],
})
export class ImageGalleryComponent implements OnChanges {
  @Input() images: string[] = [];
  @Input() alt = '';

  activeIndex = signal(0);

  ngOnChanges(): void {
    this.activeIndex.set(0);
  }

  select(i: number): void {
    this.activeIndex.set(i);
  }
}
