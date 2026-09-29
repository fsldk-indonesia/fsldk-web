import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { GalleryRepository } from '../../repositories/gallery.repository';
import { GalleryLightboxComponent } from '../../components/gallery-lightbox/gallery-lightbox.component';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { resolveImageUrl, resolveThumbnailUrl } from '../../../../core/utils/image-url';

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
      <!-- ---------- Hero Header — TIDAK lagi memakai cover image apa adanya
           sebagai background penuh-layar (foto dokumentasi kadang berupa
           screenshot/QR/teks yang jadi pecah & tidak terbaca saat dibentangkan
           sebesar itu, dilaporkan "jelek"). Latar sekarang murni gradasi +
           tekstur titik (pola sama seperti app-page-hero), cover image-nya
           ditampilkan dalam bingkai kartu berukuran wajar di kolom kanan —
           seburuk apa pun isi fotonya, dampaknya kecil & terkontrol. ---------- -->
      <header class="hero-section">
        <div class="hero-texture" aria-hidden="true"></div>
        <div class="hero-glow" aria-hidden="true"></div>
        <div class="container hero-grid">
          <div class="hero-copy">
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

          <div class="hero-visual">
            <div class="hero-cover-frame">
              @if (gallery.coverImage) {
                <img [src]="imgUrl(gallery.coverImage)" [alt]="gallery.eventName" class="hero-cover-img" />
              } @else {
                <div class="hero-cover-fallback"><app-icon name="images" [size]="40" /></div>
              }
              <span class="hero-cover-badge"><app-icon name="images" [size]="12" /> {{ gallery.totalPhotos }} Foto</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Breadcrumb Navigation — kartu pil mengambang di atas kanvas tint
           hijau yang sama dengan section listing Galeri (bukan lagi baris
           teks polos "/" di atas latar transparan). -->
      <nav class="breadcrumb-bar" aria-label="Breadcrumb">
        <div class="container">
          <ol class="breadcrumb-pill reveal">
            <li><a routerLink="/" class="crumb-link"><app-icon name="home" [size]="13" /> Beranda</a></li>
            <li class="crumb-sep" aria-hidden="true"><app-icon name="chevron-right" [size]="11" /></li>
            <li><a routerLink="/tentang/galeri" class="crumb-link"><app-icon name="images" [size]="13" /> Galeri</a></li>
            <li class="crumb-sep" aria-hidden="true"><app-icon name="chevron-right" [size]="11" /></li>
            <li class="crumb-current" aria-current="page">{{ gallery.eventName }}</li>
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
                            [src]="thumbUrl(photo.imagePath)"
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
                        itemLabel="foto"
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
    /* ---------- Breadcrumb — kartu pil putih mengambang di kanvas tint hijau
       (background section ini SENGAJA disamakan dengan .detail-main-section
       di bawahnya & titik akhir gradasi .hero-overlay, lihat komentar di
       sana — supaya hero->breadcrumb->konten jadi satu alur warna menerus,
       bukan tiga blok warna berbeda yang kelihatan berbatas). ---------- */
    .breadcrumb-bar { background: var(--color-primary-tint); padding: 18px 0 34px; }
    .breadcrumb-bar .container { display: flex; justify-content: center; }

    .breadcrumb-pill {
      display: inline-flex; align-items: center; flex-wrap: wrap; justify-content: center;
      gap: 4px; list-style: none; margin: 0; padding: 9px 20px; max-width: 100%;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-full);
      box-shadow: var(--shadow-sm);
      animation: crumbFadeUp .5s var(--ease-out) .05s both;
    }
    @keyframes crumbFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .breadcrumb-pill li { display: flex; align-items: center; }

    .crumb-link {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 9px; border-radius: var(--radius-full);
      color: var(--color-text-secondary); font-size: 0.82rem; font-weight: 600;
      text-decoration: none; white-space: nowrap;
      transition: color 0.2s ease, background 0.2s ease;
    }
    .crumb-link app-icon { opacity: 0.75; }
    .crumb-link:hover { color: var(--color-primary-dark); background: var(--color-primary-soft); text-decoration: none; }

    .crumb-sep { color: var(--color-border-strong); flex-shrink: 0; }

    .crumb-current {
      padding: 5px 9px; color: var(--color-primary-dark); font-weight: 700; font-size: 0.82rem;
      max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    @media (max-width: 640px) {
      .crumb-link span, .crumb-link { font-size: 0.78rem; }
      .crumb-current { max-width: 160px; font-size: 0.78rem; }
      .breadcrumb-pill { gap: 2px; padding: 7px 14px; }
    }

    /* Latar gradasi + tekstur titik — pola sama dengan app-page-hero
       (shared/page-hero.component.ts), disalin di sini karena view
       encapsulation. Tidak lagi bergantung sama sekali pada isi cover image
       (lihat .hero-cover-frame di bawah), jadi kualitas foto dokumentasi
       apa pun tidak bisa merusak tampilan hero-nya sendiri. */
    .hero-section {
      position: relative;
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 62%, var(--color-primary-darker) 100%);
      color: #fff;
      padding: 64px 0 56px;
      overflow: hidden;
    }

    .hero-texture {
      position: absolute; inset: 0; opacity: .5; pointer-events: none;
      background-image: radial-gradient(circle, rgba(255,255,255,.5) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 15% -10px;
      mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
    }
    .hero-glow {
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse 55% 65% at 88% 30%, rgba(255,196,0,.18) 0%, transparent 70%);
    }
    /* Sempat dicoba fade linear-gradient (belang pucat kotor — bug
       interpolasi "transparent") dan wave SVG (kelihatan seperti pita putih
       terpisah karena var(--color-primary-tint) = #f3faf5, nyaris putih,
       jadi wave-nya kebaca sebagai "warna ketiga" alih-alih menyatu). Kedua
       percobaan itu DIBUANG — potongan tegas dua warna solid (hero hijau tua
       -> .breadcrumb-bar tint) yang paling bersih & sesuai permintaan
       eksplisit ("cuma warna hijau & warna seperti di Beranda", TANPA warna
       ketiga di antaranya). */

    .hero-grid {
      position: relative; z-index: 2;
      display: grid; grid-template-columns: 1.15fr 1fr; gap: 40px; align-items: center;
    }

    .hero-copy { position: relative; z-index: 2; }

    .hero-badges {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
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
      justify-content: flex-start;
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

    .hero-badges, .hero-event-name, .hero-title, .hero-actions {
      opacity: 0; animation: heroCopyFadeUp .7s var(--ease-out) forwards;
    }
    .hero-badges { animation-delay: .05s; }
    .hero-event-name { animation-delay: .15s; }
    .hero-title { animation-delay: .25s; }
    .hero-actions { animation-delay: .4s; }
    @keyframes heroCopyFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

    /* ---------- Cover image — dibingkai kartu berukuran wajar (BUKAN
       object-fit:cover penuh-layar yang memotong foto), object-fit:contain
       supaya foto sampul selalu terlihat UTUH apa pun rasio aslinya; sisa
       ruang di sekitarnya jadi matte/bingkai, bukan crop paksa. ---------- */
    .hero-visual { position: relative; z-index: 2; display: flex; justify-content: center; }
    .hero-cover-frame {
      position: relative; width: 100%; max-width: 420px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.25);
      border-radius: 20px; padding: 10px; box-sizing: border-box;
      box-shadow: 0 24px 50px rgba(0,0,0,.35);
      opacity: 0; animation: heroCoverIn .7s var(--ease-out) .3s forwards;
    }
    @keyframes heroCoverIn { from { opacity: 0; transform: scale(.92) translateY(10px); } to { opacity: 1; transform: none; } }
    .hero-cover-img {
      display: block; width: 100%; max-height: 380px;
      object-fit: contain; border-radius: 12px;
    }
    .hero-cover-fallback {
      width: 100%; height: 220px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,.06); color: rgba(255,255,255,.6);
    }
    .hero-cover-badge {
      position: absolute; left: 22px; bottom: 22px; z-index: 2;
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,.2); color: #fff;
      font-size: .74rem; font-weight: 700; padding: 5px 11px; border-radius: 999px;
    }

    @media (max-width: 900px) {
      .hero-grid { grid-template-columns: 1fr; gap: 28px; }
      .hero-copy { text-align: center; }
      .hero-badges, .hero-actions { justify-content: center; }
      .hero-visual { order: -1; }
      .hero-cover-frame { max-width: 340px; }
    }

    /* ---------- Kanvas konten — DISAMAKAN dengan .section-blob-drift index
       Galeri (tint hijau + dua radial-gradient "blob" yang melayang pelan),
       supaya berpindah dari listing ke detail tidak terasa seperti masuk ke
       halaman lain sama sekali. Duplikasi disengaja (view encapsulation
       Angular tidak membagikan style antar komponen), lihat komentar aslinya
       di gallery.public-index.page.ts. ---------- */
    .detail-main-section {
      position: relative;
      overflow: hidden;
      padding: 8px 0 80px;
      background: var(--color-primary-tint);
    }
    .detail-main-section::before {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 55% 45% at 92% 0%, var(--color-gold-soft) 0%, var(--color-primary-soft) 42%, transparent 72%),
        radial-gradient(ellipse 50% 45% at 4% 28%, var(--color-primary-soft) 0%, var(--color-gold-soft) 45%, transparent 72%);
      opacity: .75;
      animation: detailBlobDrift 12s ease-in-out infinite alternate;
    }
    /* Fade-mask tepi atas — TANPA ini, blob di atas mulai tepat di 0% (garis
       batas dengan .breadcrumb-bar), jadi warna hangat blob-nya kelihatan
       "muncul tiba-tiba" persis di seam (dilaporkan: "warnanya masih beda").
       Menutupi 70px pertama balik ke flat var(--color-primary-tint) — sama
       PERSIS milik .breadcrumb-bar di atasnya — supaya blob baru mulai
       terlihat setelah masuk cukup dalam, bukan menempel di garis batas.
       Endpoint transparan DITULIS rgba(...,0) dengan RGB SAMA (bukan
       keyword 'transparent' polos, itu rgba(0,0,0,0) — pernah kejadian
       belang pucat kotor di percobaan fade sebelumnya karena browser
       menginterpolasi lewat hitam semi-transparan) — RGB yang sama di kedua
       ujung menutup celah itu, cuma alpha yang berubah. */
    .detail-main-section::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: linear-gradient(to bottom, var(--color-primary-tint) 0, rgba(243, 250, 245, 0) 70px);
    }
    .detail-main-section > .container { position: relative; z-index: 1; }
    @keyframes detailBlobDrift {
      from { transform: translate(0, 0) scale(1); }
      to { transform: translate(-4%, 5%) scale(1.15); }
    }
    @media (prefers-reduced-motion: reduce) { .detail-main-section::before { animation: none; } }

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
        padding: 4px 0 64px;
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

  imgUrl = resolveImageUrl;
  thumbUrl = resolveThumbnailUrl;
}
