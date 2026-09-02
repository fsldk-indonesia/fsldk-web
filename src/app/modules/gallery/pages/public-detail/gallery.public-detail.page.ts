import { Component, OnInit, inject, signal } from '@angular/core';
import { Title, DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { GalleryRepository } from '../../repositories/gallery.repository';
import { GalleryLightboxComponent } from '../../components/gallery-lightbox/gallery-lightbox.component';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { environment } from '../../../../../environments/environment';

/**
 * Public detail page displaying a gallery documentation entry, YouTube video, and photo grid with lightbox.
 */
@Component({
  selector: 'app-gallery-public-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, GalleryLightboxComponent, IconComponent, PaginationComponent],
  template: `
    @if (repo.loading()) {
      <div class="empty-state py-xl">
        <div class="spinner"></div>
        <p class="mt-sm text-muted">Memuat dokumentasi galeri...</p>
      </div>
    } @else if (repo.error()) {
      <div class="container py-xl text-center">
        <div class="empty-icon text-danger"><app-icon name="alert-triangle" [size]="48" /></div>
        <h3>Terjadi Kesalahan</h3>
        <p class="text-muted">{{ repo.error() }}</p>
        <a routerLink="/tentang/galeri" class="btn btn-outline mt-md">Kembali ke Galeri</a>
      </div>
    } @else {
      @if (repo.currentGallery(); as gallery) {
      <!-- Hero Header Section (Immediately below Navbar) -->
      <header class="hero-section">
        <div class="hero-bg" [style.backgroundImage]="'url(' + imgUrl(gallery.coverImage) + ')'"></div>
        <div class="hero-overlay"></div>
        <div class="container hero-content">
          <div class="hero-text-content">
            <div class="hero-badges">
              @if (gallery.eventDate) {
                <span class="hero-tag"><app-icon name="calendar-days" [size]="13" /> {{ gallery.eventDate | date: 'd MMMM y' }}</span>
              }
              <span class="hero-tag"><app-icon name="images" [size]="13" /> {{ gallery.totalPhotos }} Foto</span>
              @if (gallery.youtubeVideoID) {
                <span class="hero-tag hero-tag-video"><app-icon name="play-circle" [size]="13" /> Video</span>
              }
            </div>

            <span class="hero-event-name">{{ gallery.eventName }}</span>
            <h1 class="hero-title">{{ gallery.eventTheme }}</h1>

            @if (gallery.documentLink) {
              <div class="hero-actions">
                <a
                  [href]="gallery.documentLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-doc"
                >
                  <app-icon name="external-link" [size]="15" /> Buka Folder Dokumentasi Lengkap
                </a>
              </div>
            }
          </div>
        </div>
      </header>

      <!-- Breadcrumb Navigation (Below Hero) -->
      <nav class="breadcrumb-container" aria-label="Breadcrumb">
        <div class="container">
          <ol class="breadcrumb">
            <li><a routerLink="/">Beranda</a></li>
            <li><a routerLink="/tentang/galeri">Galeri</a></li>
            <li class="active" aria-current="page">{{ gallery.eventName }}</li>
          </ol>
        </div>
      </nav>

      <!-- Main Content Details -->
      <main class="detail-main-section">
        <div class="container">
          <div class="content-layout">
            <!-- Main Column: Story Description, Photos, and Video -->
            <div class="primary-column">
              <!-- Event Description -->
              <section class="detail-card mb-lg">
                <h2 class="card-heading">
                  <app-icon name="info-circle" [size]="20" /> Tentang Kegiatan
                </h2>
                <div
                  class="rich-text-display mt-md"
                  [innerHTML]="sanitizeHtml(gallery.eventDescription)"
                ></div>
              </section>

              <!-- Photo Gallery Grid (Swapped Above Video) -->
              <section class="detail-card mb-lg" id="photos-section">
                <div class="photos-header">
                  <div>
                    <h2 class="card-heading">
                      <app-icon name="images" [size]="20" /> Foto Dokumentasi
                    </h2>
                    <p class="text-muted text-sm mt-xs">
                      Klik foto untuk memperbesar tampilan (lightbox) dan navigasi.
                    </p>
                  </div>
                  @if (repo.photoPage(); as page) {
                    <span class="photos-count-badge">Total {{ page.total }} Foto</span>
                  }
                </div>

                @if (repo.photosLoading() && !repo.photoPage()) {
                  <div class="text-center py-lg">
                    <div class="spinner"></div>
                    <p class="text-muted mt-sm">Memuat foto...</p>
                  </div>
                } @else if (!repo.photoPage() || repo.photoPage()!.data.length === 0) {
                  <div class="empty-state py-lg">
                    <div class="empty-icon"><app-icon name="images" [size]="40" /></div>
                    <p class="text-muted mt-xs">Belum ada foto tambahan untuk galeri ini.</p>
                  </div>
                } @else {
                  <div class="photo-grid-wrapper mt-md" [class.switching]="isPageChanging()">
                    @if (isPageChanging()) {
                      <div class="grid-loading-bar"></div>
                    }
                    <div class="photo-grid">
                      @for (photo of repo.photoPage()!.data; track photo.photoID; let idx = $index) {
                        <div
                          class="photo-card"
                          [class.photo-card-featured]="idx % 7 === 0"
                          (click)="openLightbox(idx)"
                          role="button"
                          tabindex="0"
                          (keydown.enter)="openLightbox(idx)"
                        >
                          <img
                            [src]="imgUrl(photo.imagePath)"
                            [alt]="photo.caption || 'Foto dokumentasi ' + (idx + 1)"
                            class="photo-thumbnail"
                            loading="lazy"
                          />
                          @if (photo.caption) {
                            <div class="photo-caption-overlay">
                              <span class="photo-caption-preview">{{ photo.caption }}</span>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Photos Pagination -->
                  @if (repo.photoPage() && repo.photoPage()!.total > photosLimit) {
                    <div class="pagination-wrapper mt-lg">
                      <app-pagination
                        [page]="repo.photoPage()!.page"
                        [count]="repo.photoPage()!.total"
                        [limit]="photosLimit"
                        (pageChange)="onPhotoPageChange($event)"
                      />
                    </div>
                  }
                }
              </section>

              <!-- YouTube Video Embed (Below Photos) -->
              @if (gallery.youtubeVideoID) {
                <section class="detail-card mb-lg">
                  <h2 class="card-heading">
                    <app-icon name="video" [size]="20" /> Video Dokumentasi
                  </h2>
                  <div class="video-container mt-md">
                    <iframe
                      [src]="safeYoutubeUrl(gallery.youtubeVideoID)"
                      title="Video Dokumentasi {{ gallery.eventName }}"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                      class="video-iframe"
                    ></iframe>
                  </div>
                </section>
              }
            </div>
          </div>
        </div>
      </main>

      <!-- Lightbox Modal -->
      @if (repo.photoPage()) {
        <app-gallery-lightbox
          [photos]="repo.photoPage()!.data"
          [initialIndex]="selectedPhotoIndex()"
          [isOpen]="lightboxOpen()"
          [galleryTitle]="gallery.eventTheme"
          (close)="closeLightbox()"
        />
      }
    }
  }
  `,
  styles: [`
    .breadcrumb-container {
      background: transparent;
      border-bottom: none;
      padding: 28px 0 10px;
    }

    .breadcrumb {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      list-style: none;
      margin: 0;
      padding: 0;
      font-size: 0.85rem;
    }

    .breadcrumb li {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-text-muted);
    }

    .breadcrumb li:not(:last-child)::after {
      content: '/';
      color: var(--color-text-muted);
    }

    .breadcrumb a {
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: color 0.2s;
    }

    .breadcrumb a:hover {
      color: var(--color-primary);
    }

    .breadcrumb .active {
      color: var(--color-text);
      font-weight: 600;
    }

    .hero-section {
      position: relative;
      background: var(--color-primary-dark, #064e3b);
      color: #fff;
      padding: 70px 0 80px;
      overflow: hidden;
    }

    .hero-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      transform: scale(1.02);
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(13, 92, 59, 0.65) 0%,
        rgba(6, 78, 59, 0.58) 60%,
        rgba(10, 60, 42, 0.62) 82%,
        var(--color-bg, #f8faf9) 100%
      );
    }

    .hero-content {
      position: relative;
      z-index: 2;
    }

    .hero-text-content {
      max-width: 860px;
      margin: 0 auto;
      text-align: center;
    }

    .hero-badges {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .hero-tag {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #fff;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .hero-tag-video {
      background: rgba(220, 38, 38, 0.85);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .hero-event-name {
      display: block;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-primary-soft);
      letter-spacing: 0.03em;
      margin-bottom: 8px;
    }

    .hero-title {
      font-size: 2.5rem;
      font-weight: 900;
      font-family: var(--font-heading);
      line-height: 1.25;
      color: #fff;
      margin: 0 0 24px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
    }

    .hero-actions {
      display: flex;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .btn-doc {
      background: var(--color-primary);
      color: #fff;
      font-weight: 700;
      border-radius: 999px;
      padding: 10px 22px;
      font-size: 0.9rem;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.35);
      transition: all 0.2s ease;
    }

    .btn-doc:hover {
      background: var(--color-primary-dark);
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 8px 22px rgba(13, 92, 59, 0.4);
    }

    .detail-main-section {
      padding: 56px 0 80px;
      background: var(--color-bg, #f8faf9);
    }

    .content-layout {
      max-width: 1080px;
      margin: 0 auto;
    }

    .primary-column {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .detail-card {
      background: #fff;
      border-radius: 18px;
      padding: 32px;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .card-heading {
      font-size: 1.28rem;
      font-weight: 800;
      font-family: var(--font-heading);
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
    }

    .video-container {
      position: relative;
      width: 100%;
      padding-top: 56.25%; /* 16:9 ratio */
      background: #000;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: var(--shadow-md);
    }

    .video-iframe {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .photos-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }

    .photos-count-badge {
      font-size: 0.82rem;
      font-weight: 700;
      background: var(--color-primary-soft);
      color: var(--color-primary-dark);
      padding: 6px 14px;
      border-radius: 999px;
      white-space: nowrap;
    }

    .photo-grid-wrapper {
      position: relative;
      transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .photo-grid-wrapper.switching {
      opacity: 0.5;
      pointer-events: none;
    }

    .grid-loading-bar {
      position: absolute;
      top: -6px;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--color-primary, #0d5c3b), #10b981, var(--color-primary, #0d5c3b));
      background-size: 200% 100%;
      animation: shimmer 1s infinite linear;
      border-radius: 999px;
      z-index: 10;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .photo-card {
      position: relative;
      width: 100%;
      padding-top: 68%; /* 4:3 / 16:11 aspect ratio */
      background: var(--color-bg-alt);
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      border: 1px solid var(--color-border);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease;
      will-change: transform;
      z-index: 1;
    }

    .photo-card:hover {
      transform: scale(1.03) translateY(-4px);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15);
      border-color: rgba(13, 92, 59, 0.35);
      z-index: 3;
    }

    /* Featured wide panoramic photo at the top of each set of 7 */
    .photo-card.photo-card-featured {
      grid-column: 1 / -1;
      padding-top: 42%; /* panoramic wide ratio approx 2.4:1 / 16:7 */
      border-radius: 18px;
    }

    .photo-card.photo-card-featured:hover {
      transform: scale(1.015) translateY(-4px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
    }

    .photo-thumbnail {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .photo-caption-overlay {
      position: absolute;
      inset: auto 0 0 0;
      background: linear-gradient(
        180deg,
        rgba(15, 23, 42, 0) 0%,
        rgba(15, 23, 42, 0.75) 100%
      );
      padding: 24px 16px 12px;
      opacity: 0;
      transition: opacity 0.25s ease;
      display: flex;
      align-items: flex-end;
      color: #fff;
      pointer-events: none;
    }

    .photo-card:hover .photo-caption-overlay {
      opacity: 1;
    }

    .photo-caption-preview {
      font-size: 0.8rem;
      font-weight: 500;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    }

    .pagination-wrapper {
      display: flex;
      justify-content: center;
    }

    @media (max-width: 992px) {
      .detail-main-section {
        padding: 40px 0 64px;
      }
      .hero-title { font-size: 2rem; }
      .photo-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
      }
      .photo-card.photo-card-featured {
        padding-top: 46%;
      }
    }

    @media (max-width: 640px) {
      .hero-section { padding: 48px 0 60px; }
      .hero-title { font-size: 1.6rem; }
      .detail-card { padding: 20px; }
      .photo-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .photo-card {
        border-radius: 12px;
        padding-top: 72%;
      }
      .photo-card.photo-card-featured {
        grid-column: 1 / -1;
        padding-top: 54%;
        border-radius: 14px;
      }
    }
  `],
})
export class GalleryPublicDetailPage implements OnInit {
  repo = inject(GalleryRepository);
  private route = inject(ActivatedRoute);
  private title = inject(Title);
  private sanitizer = inject(DomSanitizer);

  galleryId = 0;
  photosLimit = 7;

  lightboxOpen = signal<boolean>(false);
  selectedPhotoIndex = signal<number>(0);

  // In-memory cache for visited pages to provide instant 0ms transitions
  photoCache = new Map<number, any>();
  isPageChanging = signal<boolean>(false);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.galleryId = Number(idParam);
      this.repo.loadPublicDetail(this.galleryId);
      this.fetchPhotos(1);
    }
  }

  fetchPhotos(page: number): void {
    if (this.photoCache.has(page)) {
      this.repo.photoPage.set(this.photoCache.get(page)!);
      return;
    }

    const isFirstLoad = !this.repo.photoPage();
    if (!isFirstLoad) {
      this.isPageChanging.set(true);
    }

    this.repo.loadPhotosPublic(this.galleryId, page, this.photosLimit, (result) => {
      this.photoCache.set(page, result);
      this.isPageChanging.set(false);
    });
  }

  onPhotoPageChange(page: number): void {
    this.fetchPhotos(page);
  }

  openLightbox(index: number): void {
    this.selectedPhotoIndex.set(index);
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  safeYoutubeUrl(videoID: string): SafeResourceUrl {
    const embedUrl = `https://www.youtube.com/embed/${videoID}?rel=0`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
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
