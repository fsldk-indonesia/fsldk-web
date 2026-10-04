import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { GalleryRepository } from '../../repositories/gallery.repository';
import { GalleryLightboxComponent } from '../../components/gallery-lightbox/gallery-lightbox.component';
import { IconComponent } from '../../../../shared/icon.component';
import { resolveImageUrl, resolveThumbnailUrl } from '../../../../core/utils/image-url';

/**
 * Public detail page displaying a gallery documentation entry, YouTube video, and photo grid with lightbox.
 */
@Component({
  selector: 'app-gallery-public-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, GalleryLightboxComponent, IconComponent],
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
        <a routerLink="/galeri" class="btn btn-outline mt-md">Kembali ke Galeri</a>
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

      <!-- ---------- Konten — BENTO: beberapa kartu terpisah yang disusun
           grid 2-kolom (bukan 1 kartu memanjang ke bawah, dilaporkan
           langsung dua kali: pertama "kaku/pisah-pisah" ketika masih 3 kartu
           bertumpuk jauh, lalu digabung jadi 1 kartu besar — itu juga
           ditolak, "gk 1 card ... gk memanjang kebawah"). Solusinya: tetap
           beberapa kartu (bukan satu), tapi disusun MELEBAR (Tentang Kegiatan
           + Ringkasan berdampingan di baris pertama) alih-alih cuma
           ditumpuk vertikal — total tinggi halaman lebih pendek & terasa
           tersusun, bukan daftar kotak maupun satu kotak raksasa. Breadcrumb
           jadi baris polos di luar kartu (tanpa pil/bingkai sendiri). ---------- -->
      <main class="detail-main-section">
        <div class="container">
          <div class="content-layout">
            <nav class="crumb-row reveal" aria-label="Breadcrumb">
              <a routerLink="/" class="crumb-link"><app-icon name="home" [size]="13" /> Beranda</a>
              <app-icon name="chevron-right" [size]="11" class="crumb-sep" />
              <a routerLink="/galeri" class="crumb-link"><app-icon name="images" [size]="13" /> Galeri</a>
              <app-icon name="chevron-right" [size]="11" class="crumb-sep" />
              <span class="crumb-current" aria-current="page">{{ gallery.eventName }}</span>
            </nav>

            <div class="story-grid">
              <!-- Tentang Kegiatan — teks mengalir, bukan kotak "info" -->
              <section class="detail-card story-card-about">
                <span class="eyebrow"><app-icon name="info-circle" [size]="13" /> Tentang Kegiatan</span>
                <div
                  class="story-lead-text mt-sm"
                  [innerHTML]="sanitizeHtml(gallery.eventDescription)"
                ></div>
              </section>

              <!-- Ringkasan — kartu pendamping, bikin baris pertama melebar
                   (bukan sekadar teks sendirian), sekaligus jalan pintas
                   lompat ke Foto/Video tanpa perlu scroll panjang. -->
              <aside class="detail-card story-card-info">
                <span class="eyebrow"><app-icon name="sparkles" [size]="13" /> Ringkasan</span>
                <ul class="info-rows mt-sm">
                  @if (gallery.eventDate) {
                    <li class="info-row">
                      <span class="info-row-icon"><app-icon name="calendar-days" [size]="14" /></span>
                      <span class="info-row-text"><b>Tanggal Kegiatan</b>{{ gallery.eventDate | date: 'd MMMM y' }}</span>
                    </li>
                  }
                  <li class="info-row">
                    <span class="info-row-icon"><app-icon name="images" [size]="14" /></span>
                    <span class="info-row-text"><b>Total Foto</b>{{ gallery.totalPhotos }} foto</span>
                  </li>
                  @if (gallery.youtubeVideoID) {
                    <li class="info-row">
                      <span class="info-row-icon"><app-icon name="video" [size]="14" /></span>
                      <span class="info-row-text"><b>Video</b>Tersedia</span>
                    </li>
                  }
                </ul>
                @if (gallery.documentLink) {
                  <a
                    [href]="gallery.documentLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="info-cta"
                  >
                    <app-icon name="external-link" [size]="13" /> Tautan Dokumentasi Lengkap
                  </a>
                }
              </aside>

              <!-- Foto Dokumentasi — grid 4 kolom yang mengalir ke bawah
                   (bukan lagi filmstrip geser horizontal, dilaporkan "gk
                   usah geser-geser"), kartu seragam tanpa perlakuan
                   "featured" khusus supaya tidak ada foto yang dipotong
                   paksa jadi panoramic (lihat riwayat redesign grid lama). -->
              <section class="detail-card story-card-photos" id="photos-section">
                <div class="story-block-head">
                  <span class="eyebrow"><app-icon name="images" [size]="13" /> Foto Dokumentasi</span>
                  @if (repo.photoPage(); as page) {
                    <span class="story-count">{{ page.total }} Foto</span>
                  }
                </div>
                <p class="text-muted text-sm mt-xs">
                  Klik foto untuk memperbesar tampilan (lightbox) dan navigasi.
                </p>

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
                  <div class="photo-grid-wrap mt-md">
                    <div class="photo-grid">
                      @for (photo of repo.photoPage()!.data; track photo.photoID; let idx = $index) {
                        <button
                          type="button"
                          class="photo-grid-card"
                          (click)="openLightbox(idx)"
                        >
                          <img
                            [src]="thumbUrl(photo.imagePath)"
                            [alt]="photo.caption || 'Foto dokumentasi ' + (idx + 1)"
                            class="photo-grid-img"
                            loading="lazy"
                          />
                          @if (photo.caption) {
                            <span class="photo-grid-caption">{{ photo.caption }}</span>
                          }
                        </button>
                      }
                    </div>
                  </div>
                }
              </section>

              <!-- YouTube Video Embed -->
              @if (gallery.youtubeVideoID) {
                <section class="detail-card story-card-video" id="video-section">
                  <span class="eyebrow"><app-icon name="video" [size]="13" /> Video Dokumentasi</span>
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
    /* ---------- Breadcrumb — BUKAN lagi pil putih mengambang di section-nya
       sendiri (dilaporkan "kaku"/"pisah-pisah" bareng kartu-kartu konten di
       bawahnya). Sekarang jadi baris teks polos di KEPALA .detail-card,
       dipisah garis tipis .crumb-row dari "Tentang Kegiatan" — bagian dari
       kartu yang sama, bukan elemen mengambang terpisah. ---------- */
    .crumb-row {
      display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
      font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary);
      margin-bottom: 20px;
    }
    .crumb-link {
      display: inline-flex; align-items: center; gap: 5px;
      color: inherit; text-decoration: none; white-space: nowrap;
      transition: color 0.2s ease;
    }
    .crumb-link app-icon { opacity: 0.75; }
    .crumb-link:hover { color: var(--color-primary-dark); text-decoration: none; }

    .crumb-sep { color: var(--color-border-strong); flex-shrink: 0; }

    .crumb-current {
      color: var(--color-primary-dark); font-weight: 700;
      max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    @media (max-width: 640px) {
      .crumb-row { font-size: 0.76rem; gap: 4px; margin-bottom: 14px; }
      .crumb-current { max-width: 140px; }
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
       -> tint .detail-main-section di bawahnya) yang paling bersih & sesuai
       permintaan eksplisit ("cuma warna hijau & warna seperti di Beranda",
       TANPA warna ketiga di antaranya). */

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
      border-radius: 5%; padding: 10px; box-sizing: border-box; overflow: hidden;
      box-shadow: 0 24px 50px rgba(0,0,0,.35);
      opacity: 0; animation: heroCoverIn .7s var(--ease-out) .3s forwards;
    }
    @keyframes heroCoverIn { from { opacity: 0; transform: scale(.92) translateY(10px); } to { opacity: 1; transform: none; } }
    /* width/height:auto (dibatasi max-width/max-height) — box gambar
       menyusut mengikuti rasio ASLI foto, bukan dipaksa width:100% lalu
       disusutkan object-fit:contain di dalamnya (itu yang bikin box lebih
       besar dari konten yang terlihat, border-radius jadi membulatkan area
       kosong di sekitarnya, bukan tepi foto aslinya). Box == konten persis,
       jadi border-radius membulatkan tepi foto yang sungguhan. */
    .hero-cover-img {
      display: block; max-width: 100%; max-height: 380px; width: auto; height: auto;
      object-fit: contain; border-radius: 5%;
    }
    .hero-cover-fallback {
      width: 100%; height: 220px; border-radius: 5%;
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
      padding: 48px 0 80px;
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
       batas dengan hero di atasnya), jadi warna hangat blob-nya kelihatan
       "muncul tiba-tiba" persis di seam (dilaporkan: "warnanya masih beda").
       Menutupi 70px pertama balik ke flat var(--color-primary-tint) supaya
       blob baru mulai terlihat setelah masuk cukup dalam, bukan menempel di
       garis batas. Endpoint transparan DITULIS rgba(...,0) dengan RGB SAMA (bukan
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

    /* ---------- Bento — beberapa kartu TERPISAH (bukan satu kartu raksasa
       memanjang ke bawah, lihat komentar di template) disusun grid 2-kolom.
       Tentang Kegiatan + Ringkasan berdampingan jadi baris pertama, Foto &
       Video melebar penuh di baris-baris berikutnya (keduanya butuh lebar
       penuh untuk nyaman — grid foto & video 16:9). ---------- */
    .story-grid {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 24px;
    }
    .story-card-photos, .story-card-video { grid-column: 1 / -1; }
    /* Grid item default min-width:auto (bukan 0) — konten lebar di dalam
       kartu (mis. teks panjang tanpa spasi) bisa memaksa track grid (dan
       viewport mobile) melebar alih-alih mengikuti lebar kolom yang
       tersedia. Dipertahankan sebagai pengaman meski sumber overflow
       aslinya (filmstrip geser) sudah diganti grid 4 kolom di bawah. */
    .story-grid > * { min-width: 0; }

    .detail-card {
      background: #fff;
      border-radius: 20px;
      padding: 32px;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    /* Ringkasan — daftar fakta singkat + CTA dokumentasi lengkap, supaya
       kartu ini bukan cuma pengisi grid tapi punya fungsi nyata. */
    .info-rows { display: flex; flex-direction: column; gap: 14px; list-style: none; margin: 0; padding: 0; }
    .info-row { display: flex; align-items: center; gap: 12px; }
    .info-row-icon {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 32px; height: 32px; border-radius: 10px;
      background: var(--color-primary-soft); color: var(--color-primary-dark);
    }
    .info-row-text { display: flex; flex-direction: column; gap: 1px; font-size: 0.86rem; color: var(--color-text); }
    .info-row-text b { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-muted); }

    .info-cta {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border);
      font-size: 0.84rem; font-weight: 700; color: var(--color-primary-dark);
      text-decoration: none;
    }
    .info-cta:hover { color: var(--color-primary); text-decoration: none; }

    @media (max-width: 860px) {
      .story-grid { grid-template-columns: 1fr; }
    }

    /* ---------- Blok cerita — eyebrow label (pakai .eyebrow global) di atas
       tiap topik, BUKAN lagi h2.card-heading berbingkai besar — biar terasa
       sebagai bagian dari satu alur cerita, bukan judul kotak terpisah. ---------- */
    .story-lead-text {
      font-size: 1.04rem;
      line-height: 1.9;
      color: var(--color-text-secondary);
    }

    .story-block-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .story-count {
      font-size: 0.78rem;
      font-weight: 700;
      background: var(--color-primary-soft);
      color: var(--color-primary-dark);
      padding: 5px 12px;
      border-radius: 999px;
      white-space: nowrap;
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

    /* ---------- Grid foto — 4 kolom yang mengalir ke bawah (dilaporkan "gk
       usah geser-geser, langsung kebawah aja"), bukan lagi filmstrip geser
       horizontal. Kartu tetap SERAGAM ukurannya, tidak ada perlakuan
       "featured" khusus — itu yang dulu bikin foto pertama dipotong paksa
       jadi panoramic (dilaporkan jelek, apalagi galeri isi sedikit/foto
       potret seperti headshot) — pelajaran itu tetap dipakai di sini. ---------- */
    .photo-grid-wrap { position: relative; }

    .photo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

    .photo-grid-card {
      position: relative; aspect-ratio: 4 / 3; border: none; padding: 0; cursor: pointer;
      background: var(--color-bg-alt); border-radius: 16px; overflow: hidden;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
    }
    @media (hover: hover) and (pointer: fine) {
      .photo-grid-card:hover { transform: translateY(-5px); box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15); }
      .photo-grid-card:hover .photo-grid-caption { opacity: 1; }
    }

    .photo-grid-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }

    .photo-grid-caption {
      position: absolute; inset: auto 0 0 0; z-index: 1;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.75) 100%);
      padding: 24px 12px 8px; opacity: 0; transition: opacity 0.25s ease;
      color: #fff; font-size: 0.72rem; font-weight: 500; line-height: 1.3; text-align: left;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6); pointer-events: none;
    }

    @media (max-width: 992px) {
      .detail-main-section {
        padding: 36px 0 64px;
      }
      .hero-title { font-size: 2rem; }
      .photo-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
    }

    @media (max-width: 640px) {
      .hero-section { padding: 48px 0 60px; }
      .hero-title { font-size: 1.6rem; }
      .detail-card { padding: 20px; border-radius: 18px; }
      /* Eksplisit: "kalo mobile jadiin 1 baris 2 image aja". */
      .photo-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .photo-grid-card { border-radius: 12px; }
    }
  `],
})
export class GalleryPublicDetailPage implements OnInit {
  repo = inject(GalleryRepository);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  gallerySlug = '';
  /** Tidak ada pagination di grid foto — "tampilkan semuanya" baik di mobile
   *  maupun desktop, jadi limit dipasang besar supaya satu fetch sudah
   *  memulangkan seluruh foto galeri (backend tidak membatasi limit maksimum,
   *  lihat gallery_service_impl.go ListPhotosPublic). */
  photosLimit = 500;

  lightboxOpen = signal<boolean>(false);
  selectedPhotoIndex = signal<number>(0);

  ngOnInit(): void {
    const slugParam = this.route.snapshot.paramMap.get('slug');
    if (slugParam) {
      this.gallerySlug = slugParam;
      this.repo.loadPublicDetail(this.gallerySlug);
      this.repo.loadPhotosPublic(this.gallerySlug, 1, this.photosLimit);
    }
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
