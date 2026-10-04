import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GalleryRepository } from '../../repositories/gallery.repository';
import { GalleryApiService } from '../../services/gallery-api.service';
import { Gallery, GalleryListItem } from '../../entities/gallery';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { BottomSheetComponent } from '../../../../shared/bottom-sheet.component';
import { SearchFilterSortComponent, FilterFieldDef, SortOptionDef } from '../../../../shared/search-filter-sort.component';
import { resolveImageUrl, resolveThumbnailUrl } from '../../../../core/utils/image-url';

/** Maksimum titik indikator carousel mobile yang tampak sekaligus — sisanya
 *  digulung lewat window geser (dot tepi mengecil), pola sama seperti
 *  Struktur Organisasi (lihat structure.public-index.page.ts). */
const MAX_MOBILE_DOTS = 7;

/**
 * Public landing page for browsing galleries. Hero publik reusable
 * (shared/page-hero.component.ts) — bahasa visual sama dengan Struktur
 * Organisasi (kartu kutipan Hadis jadi bagian tetap hero).
 */
@Component({
  selector: 'app-gallery-public-index',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, IconComponent, PaginationComponent, PageHeroComponent, BottomSheetComponent, SearchFilterSortComponent],
  template: `
    <app-page-hero
      badge="Galeri Dokumentasi · FSLDK Indonesia"
      title="Jejak Visual"
      titleAccent="Dakwah Kampus Kita"
      subtitle="Koleksi visual, momen kebersamaan, dan arsip perjalanan dakwah FSLDK Indonesia se-Nusantara."
      quoteSource="hadith">
      <!-- Siluet sisi kanan hero, diproyeksikan lewat slot [heroVisual] milik
           app-page-hero (pola sama seperti siluet pohon di Struktur): kamera
           mengapit 2 bingkai foto (polaroid hijau/emas bergantian, mengikuti
           aksen kartu Struktur/Misi). Garis penghubung & titik sudut pakai
           primitif global .network-line/.network-node/.network-ping
           (styles.scss) — primitif "Peta Silaturahmi" yang sama dipakai
           Beranda & Struktur, bukan diimplementasi ulang di sini. -->
      <div heroVisual class="hero-gallery-cam">
        <svg aria-hidden="true" viewBox="0 0 560 320" class="gallery-cam-svg">
          <defs>
            <radialGradient id="galleryLensFill" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stop-color="var(--color-primary-bright)" stop-opacity=".85" />
              <stop offset="100%" stop-color="var(--color-primary)" stop-opacity=".7" />
            </radialGradient>
            <linearGradient id="galleryCamFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--color-primary)" />
              <stop offset="100%" stop-color="var(--color-primary-dark)" />
            </linearGradient>
          </defs>

          <g class="gallery-cam-group">
            <g class="gallery-photo-frame frame-1" transform="rotate(-9 168 178)">
              <rect x="113" y="108" width="110" height="132" rx="6" fill="#fff" stroke="var(--color-border)" />
              <rect x="122" y="116" width="92" height="90" rx="2" fill="var(--color-primary-soft)" />
              <path d="M132,180 L158,148 L176,168 L200,138 L200,196 L132,196 Z" fill="var(--color-primary-dark)" opacity=".5" />
              <circle cx="196" cy="128" r="8" fill="var(--color-gold)" />
            </g>
            <g class="gallery-photo-frame frame-2" transform="rotate(8 392 168)">
              <rect x="337" y="98" width="110" height="132" rx="6" fill="#fff" stroke="var(--color-border)" />
              <rect x="346" y="106" width="92" height="90" rx="2" fill="var(--color-gold-soft)" />
              <path d="M356,170 L378,146 L392,160 L418,132 L418,188 L356,188 Z" fill="var(--color-gold-dark)" opacity=".5" />
              <circle cx="414" cy="118" r="7" fill="var(--color-primary)" />
            </g>

            <path class="network-line thick" d="M280,226 L168,178" />
            <path class="network-line thick" d="M280,226 L392,168" />

            <rect x="205" y="180" width="150" height="92" rx="16" fill="url(#galleryCamFill)" />
            <rect x="253" y="164" width="54" height="20" rx="6" fill="url(#galleryCamFill)" />
            <rect x="216" y="168" width="24" height="14" rx="4" fill="var(--color-gold)" />
            <circle cx="280" cy="226" r="38" fill="url(#galleryLensFill)" />
            <circle cx="280" cy="226" r="22" fill="var(--color-primary-darker)" />
            <ellipse cx="268" cy="215" rx="7" ry="4" fill="#fff" opacity=".35" />
            <circle class="network-ping gold" cx="280" cy="226" r="22" />
          </g>

          <g class="gallery-tier">
            <circle class="network-node ember" cx="212" cy="114" r="6" />
            <circle class="network-node gold" cx="428" cy="108" r="6" />
          </g>
        </svg>
      </div>
    </app-page-hero>

    <section class="section section-transition section-blob-drift">
      <div class="container pb-xl">
        <!-- ---------- Kepala section listing — badge eyebrow + judul + subjudul,
             pola sama seperti "Cari & Saring" ldksyahid-app (halaman Artikel):
             hero DI ATAS memperkenalkan halaman secara umum ("Jejak Visual"),
             blok ini memperkenalkan LISTING-nya secara spesifik — sama seperti
             section lain di Beranda yang juga punya eyebrow+judul sendiri
             walau Beranda juga sudah punya hero. ---------- -->
        <div class="gallery-section-head text-center reveal" #sectionHead>
          <h2>Koleksi Dokumentasi Kegiatan</h2>
          <p class="gallery-section-subtitle">Rekam jejak visual dan momen kebersamaan dakwah kampus FSLDK Indonesia se-Nusantara.</p>
        </div>

        <!-- Search + Filter + Urutkan — komponen global (shared/search-filter-sort.component.ts),
             field filter data-driven dari repo.filterOptions() (Tahun Kegiatan/Nama Kegiatan). -->
        <div class="gallery-toolbar">
          <app-search-filter-sort
            searchPlaceholder="Cari galeri berdasarkan nama atau tema kegiatan..."
            [searchValue]="searchText()"
            [filterFields]="filterFields()"
            [filterValues]="filterValues()"
            [sortOptions]="sortOptions"
            [sortValue]="currentSort()"
            filterTitle="Filter Galeri"
            filterSubtitle="Pilih satu atau lebih filter untuk menyaring galeri."
            (searchChange)="onSearchChange($event)"
            (filterApply)="onFilterApply($event)"
            (sortChange)="onSortChange($event)"
          />
        </div>

        <!-- Content State Handler -->
        @if (repo.loading()) {
          <!-- ---------- Skeleton loading — bentuk kartu ASLI (grid overlay-foto
               desktop / carousel mobile), bukan spinner generik, supaya layout
               tidak "meloncat" begitu data datang. ---------- -->
          <div class="gallery-desktop-grid" aria-hidden="true">
            @for (i of skeletonItems; track i) {
              <div class="gallery-card-skel skel"></div>
            }
          </div>
          <div class="gallery-mobile-carousel" aria-hidden="true">
            <div class="gm-track-wrap">
              <div class="gm-track">
                @for (i of skeletonItems; track i) {
                  <div class="gm-slide"><div class="gm-slide-skel skel"></div></div>
                }
              </div>
            </div>
          </div>
        } @else if (repo.error()) {
          <div class="empty-state">
            <div class="empty-icon text-danger"><app-icon name="alert-triangle" [size]="48" /></div>
            <h3>Terjadi Kesalahan</h3>
            <p>{{ repo.error() }}</p>
            <button class="btn btn-outline mt-md" (click)="loadData()">Coba Lagi</button>
          </div>
        } @else if (repo.publicGalleries().length === 0 && hasActiveSearchOrFilter()) {
          <!-- ---------- "Tidak ditemukan" karena pencarian/filter — beda dari
               "belum ada data sama sekali" di bawah. Ikon lingkaran gradient
               sendiri (BUKAN pakai class global .icon-badge — glow ::before
               bawaannya kelihatan kotak pucat, jadi dibuang, diganti versi
               bersih yang full dikontrol di sini), "melayang" pelan, judul/
               deskripsi/chip saran muncul bertahap (stagger fade-up). ---------- -->
          <div class="empty-state gallery-empty-anim">
            <span class="gallery-empty-icon gallery-empty-icon-badge">
              <app-icon name="search" [size]="26" />
            </span>
            <h3 class="gallery-empty-title">Galeri Tidak Ditemukan</h3>
            <p class="gallery-empty-desc">Coba ubah kata kunci atau hapus beberapa filter yang aktif.</p>
            <div class="gallery-empty-suggestions">
              @if (searchText()) {
                <button type="button" class="chip" (click)="onSearchChange('')"><app-icon name="search" [size]="12" /> Coba kata kunci lebih umum</button>
              }
              @if (activeFilterCount() > 0) {
                <button type="button" class="chip" (click)="onFilterApply({})"><app-icon name="x" [size]="12" /> Hapus beberapa filter</button>
              }
              @if (searchText() && activeFilterCount() > 0) {
                <button type="button" class="chip" (click)="resetSearchAndFilter()"><app-icon name="rotate-ccw" [size]="12" /> Reset semua</button>
              }
            </div>
          </div>
        } @else if (repo.publicGalleries().length === 0) {
          <div class="empty-state gallery-empty-anim">
            <div class="empty-icon gallery-empty-icon"><app-icon name="images" [size]="48" /></div>
            <h3 class="gallery-empty-title">Belum Ada Dokumentasi</h3>
            <p class="gallery-empty-desc">Dokumentasi kegiatan belum ditambahkan atau tidak ditemukan.</p>
          </div>
        } @else {
          <!-- ---------- Desktop: grid kartu overlay-foto (>=901px) ----------
               Foto full-bleed + scrim gradasi, judul/meta mengambang di atasnya
               (bukan lagi body putih terpisah di bawah foto) — hover
               "membesar" (translateY+scale kartu, zoom foto, CTA & efek
               shine muncul) supaya terasa hidup, bukan cuma shadow naik. -->
          <div class="gallery-desktop-grid">
            @for (item of repo.publicGalleries(); track item.galleryID; let i = $index) {
              <article class="gallery-card stagger-in" [style.--stagger-i]="i">
                <a [routerLink]="['/tentang/galeri', item.galleryID]" class="gallery-card-media">
                  <img [src]="thumbUrl(item.coverImage)" [alt]="item.eventName" loading="lazy" />
                  <span class="gallery-card-scrim" aria-hidden="true"></span>
                  <span class="gallery-card-shine" aria-hidden="true"></span>

                  <span class="gallery-card-badges">
                    <span class="badge badge-photos"><app-icon name="images" [size]="12" /> {{ item.totalPhotos }} Foto</span>
                    @if (item.youtubeVideoID) {
                      <span class="badge badge-video"><app-icon name="play-circle" [size]="12" /> Video</span>
                    }
                  </span>

                  <span class="gallery-card-body">
                    @if (item.eventDate) {
                      <span class="gallery-card-date"><app-icon name="calendar-days" [size]="12" /> {{ item.eventDate | date: 'd MMMM y' }}</span>
                    }
                    <span class="gallery-card-tag">{{ item.eventName }}</span>
                    <span class="gallery-card-title">{{ item.eventTheme }}</span>
                    <span class="gallery-card-cta">Lihat Galeri <app-icon name="arrow-right" [size]="13" /></span>
                  </span>
                </a>
              </article>
            }
          </div>

          <!-- ---------- Mobile: carousel scroll-snap + dot indicator, tap kartu
               buka bottom sheet berisi deskripsi (bukan langsung pindah
               halaman) — pola sama dengan Struktur Organisasi, cuma isi
               sheet-nya deskripsi kegiatan alih-alih detail struktur.
               Deskripsi (eventDescription) tidak ada di payload list, jadi
               di-fetch on-demand saat sheet dibuka (lihat openSheet()). ---------- -->
          <div class="gallery-mobile-carousel">
            <div class="gm-track-wrap">
              <div class="gm-track" #mobileTrack (scroll)="onMobileScroll()">
                @for (item of repo.publicGalleries(); track item.galleryID; let i = $index) {
                  <div class="gm-slide stagger-in" [style.--stagger-i]="i">
                    <button type="button" class="gm-slide-card" (click)="openSheet(item)">
                      <img [src]="thumbUrl(item.coverImage)" [alt]="item.eventName" loading="lazy" />
                      <span class="gm-slide-scrim" aria-hidden="true"></span>
                      <span class="gm-slide-badges">
                        <span class="badge badge-photos"><app-icon name="images" [size]="12" /> {{ item.totalPhotos }} Foto</span>
                        @if (item.youtubeVideoID) {
                          <span class="badge badge-video"><app-icon name="play-circle" [size]="12" /> Video</span>
                        }
                      </span>
                      <span class="gm-slide-body">
                        @if (item.eventDate) {
                          <span class="gm-slide-date"><app-icon name="calendar-days" [size]="11" /> {{ item.eventDate | date: 'd MMMM y' }}</span>
                        }
                        <span class="gm-slide-title">{{ item.eventTheme }}</span>
                        <span class="gm-slide-hint"><app-icon name="eye" [size]="12" /> Ketuk untuk lihat deskripsi</span>
                      </span>
                    </button>
                  </div>
                }
              </div>
            </div>

            @if (repo.publicGalleries().length > 1) {
              <div class="gm-dots">
                @for (i of dotIndices(); track i) {
                  <button type="button" class="gm-dot" [class.active]="activeSlide() === i" [class.edge]="isEdgeDot(i)" (click)="scrollToSlide(i)" [attr.aria-label]="'Slide ' + (i + 1)"></button>
                }
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (repo.publicTotal() > limit) {
            <div class="pagination-wrapper">
              <app-pagination
                [page]="repo.publicPage()"
                [count]="repo.publicTotal()"
                [limit]="limit"
                itemLabel="galeri"
                (pageChange)="onPageChange($event)"
              />
            </div>
          }
        }
      </div>
    </section>

    <!-- ---------- Bottom sheet mobile: preview kegiatan + deskripsi ----------
         Data dasar (foto/judul/tanggal/badge) sudah ada dari list, ditampilkan
         langsung; eventDescription baru ada di endpoint detail jadi di-fetch
         saat sheet dibuka (skeleton selama menunggu). CTA footer pindah ke
         halaman detail lengkap (galeri foto penuh). ---------- -->
    <app-bottom-sheet
      [open]="sheetItem() !== null"
      (closed)="closeSheet()"
      ctaLabel="Lihat Galeri Lengkap"
      (ctaClick)="goToSheetDetail()"
    >
      @if (sheetItem(); as item) {
        <div class="sheet-image">
          <img [src]="thumbUrl(item.coverImage)" [alt]="item.eventName">
          <span class="sheet-image-badges">
            <span class="badge badge-photos"><app-icon name="images" [size]="12" /> {{ item.totalPhotos }} Foto</span>
            @if (item.youtubeVideoID) {
              <span class="badge badge-video"><app-icon name="play-circle" [size]="12" /> Video</span>
            }
          </span>
        </div>
        <span class="chip chip-green">{{ item.eventName }}</span>
        <h3 class="sheet-title">{{ item.eventTheme }}</h3>
        @if (item.eventDate) {
          <div class="sheet-meta-rows">
            <div class="sheet-meta-row">
              <span class="sheet-meta-icon"><app-icon name="calendar-days" [size]="13" /></span>
              <span>
                <span class="sheet-meta-label">Tanggal Kegiatan</span>
                <span class="sheet-meta-value">{{ item.eventDate | date: 'd MMMM y' }}</span>
              </span>
            </div>
          </div>
        }
        @if (sheetLoading()) {
          <div class="sheet-desc-skel">
            <span class="skel skel-line" style="width:100%"></span>
            <span class="skel skel-line" style="width:92%"></span>
            <span class="skel skel-line" style="width:60%"></span>
          </div>
        } @else if (sheetError()) {
          <p class="sheet-excerpt text-muted">Deskripsi tidak tersedia saat ini.</p>
        } @else {
          @if (sheetDetail(); as detail) {
            <p class="sheet-excerpt">{{ detail.eventDescription }}</p>
          }
        }
      }
    </app-bottom-sheet>
  `,
  styles: [`
    /* ---------- Siluet hero: kamera + 2 bingkai foto (polaroid) — style
       proyeksi [heroVisual] milik pemanggil (lihat komentar di template).
       Kamera "tumbuh" dulu (scale+fade dari bawah, sama seperti
       .tree-silhouette di Struktur), lalu 2 foto fade-in menyusul dengan
       stagger, lalu titik sudut (.gallery-tier) muncul terakhir — urutan
       animasi yang sama polanya dengan hub->cabang->daun di Struktur. ---------- */
    .hero-gallery-cam { position: relative; width: 100%; }
    .gallery-cam-svg { position: relative; z-index: 1; width: 100%; height: 240px; overflow: visible; }

    .gallery-cam-group {
      transform-box: fill-box; transform-origin: 50% 100%; opacity: 0;
      animation: galleryCamGrow .9s cubic-bezier(.34,1.4,.64,1) forwards;
      filter: drop-shadow(0 10px 18px rgba(0,147,59,.18));
    }
    @keyframes galleryCamGrow { from { opacity: 0; transform: scale(.75) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

    .gallery-photo-frame { opacity: 0; transform-box: fill-box; animation: galleryPhotoFadeIn .5s var(--ease-out) forwards; }
    .gallery-photo-frame.frame-1 { animation-delay: .35s; }
    .gallery-photo-frame.frame-2 { animation-delay: .55s; }
    @keyframes galleryPhotoFadeIn { from { opacity: 0; transform: translateY(14px) scale(.92); } to { opacity: 1; transform: none; } }

    .gallery-tier { opacity: 0; animation: galleryTierFadeIn .4s ease-out .9s forwards; }
    @keyframes galleryTierFadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (prefers-reduced-motion: reduce) {
      .gallery-cam-group, .gallery-photo-frame, .gallery-tier { animation: none; opacity: 1; transform: none; }
    }

    /* =====================================================================
       Kanvas setelah hero — DISALIN PERSIS dari Struktur (.section +
       .section-transition + .section-blob-drift). Lihat komentar lengkap di
       structure.public-index.page.ts — mekanisme fade-mask & blob drift-nya
       sama persis, tidak diulang di sini. ===================================================================== */
    .section { background: var(--color-primary-tint); position: relative; min-height: 60vh; }
    .section-transition { position: relative; padding-top: 32px; }
    .section-blob-drift { overflow: hidden; }
    .section-blob-drift > .container { position: relative; z-index: 1; }
    .section-blob-drift::before {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 55% 55% at 88% 42%, var(--color-gold-soft) 0%, var(--color-primary-soft) 42%, transparent 75%),
        radial-gradient(ellipse 50% 50% at 10% 62%, var(--color-primary-soft) 0%, var(--color-gold-soft) 45%, transparent 75%);
      opacity: .8; animation: sectionBlobDrift 12s ease-in-out infinite alternate;
    }
    .section-blob-drift::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: linear-gradient(to bottom,
        var(--color-primary-tint) 0, transparent 70px,
        transparent calc(100% - 70px), var(--color-primary-tint) 100%);
    }
    @keyframes sectionBlobDrift {
      from { transform: translate(0, 0) scale(1); }
      to { transform: translate(-4%, 5%) scale(1.15); }
    }
    @media (prefers-reduced-motion: reduce) {
      .section-blob-drift::before { animation: none; }
    }

    /* ---------- Kepala section listing (badge + judul + subjudul) & toolbar
       cari/filter/urutkan — lihat komentar di template. ---------- */
    .gallery-section-head { margin-bottom: 28px; }
    .gallery-section-head h2 { margin: 14px 0 10px; }
    .gallery-section-subtitle { max-width: 560px; margin: 0 auto; color: var(--color-text-secondary); font-size: 1.02rem; line-height: 1.6; }
    .gallery-toolbar { max-width: 900px; margin: 0 auto 40px; }
    .gallery-empty-suggestions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 6px; }
    .gallery-empty-suggestions .chip { display: inline-flex; align-items: center; gap: 6px; }

    /* ---------- Animasi state "tidak ada data" (kosong sejak awal maupun
       hasil pencarian/filter nihil) — ikon pop-in lalu melayang pelan, judul/
       deskripsi/chip saran muncul bertahap (stagger fade-up) supaya terasa
       hidup, bukan blok statis. ---------- */
    .gallery-empty-anim { animation: galleryEmptyFadeIn .5s var(--ease-out) both; }
    @keyframes galleryEmptyFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }

    /* Cuma animasi (pop-in + melayang) — dipakai DUA state (ikon lingkaran
       "tidak ditemukan" & ikon outline polos "belum ada data"), tampilan
       visualnya masing-masing (warna/bentuk) TIDAK disatukan di sini supaya
       "belum ada data" tetap terlihat seperti aslinya (ikon muted polos). */
    .gallery-empty-icon {
      position: relative;
      animation: galleryEmptyIconPop .5s var(--ease-out) .1s both, galleryEmptyIconFloat 3.2s ease-in-out .6s infinite;
    }
    @keyframes galleryEmptyIconPop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: scale(1); } }
    @keyframes galleryEmptyIconFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }

    /* Badge lingkaran gradient khusus ikon "tidak ditemukan" — dibuat sendiri
       (BUKAN pakai class global .icon-badge) karena glow ::before bawaannya
       tampak seperti kotak pucat di baliknya, bukan pendar bundar halus. */
    .gallery-empty-icon-badge {
      display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px;
      border-radius: 50%; margin: 0 auto 14px; color: #fff;
      background: linear-gradient(150deg, var(--color-primary-bright), var(--color-primary));
      box-shadow: 0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent);
    }

    .gallery-empty-title, .gallery-empty-desc { animation: galleryEmptyFadeIn .5s var(--ease-out) both; }
    .gallery-empty-title { animation-delay: .18s; }
    .gallery-empty-desc { animation-delay: .28s; }
    .gallery-empty-suggestions { animation: galleryEmptyFadeIn .5s var(--ease-out) .4s both; }

    .gallery-empty-suggestions .chip {
      transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease,
        background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .gallery-empty-suggestions .chip:hover {
      transform: translateY(-3px); box-shadow: var(--shadow-sm);
      background: var(--color-primary-soft); color: var(--color-primary-dark);
    }

    @media (prefers-reduced-motion: reduce) {
      .gallery-empty-anim, .gallery-empty-icon,
      .gallery-empty-title, .gallery-empty-desc, .gallery-empty-suggestions {
        animation: none; opacity: 1; transform: none;
      }
    }

    /* ---------- Skeleton loading — bentuk mengikuti kartu asli persis
       (aspect-ratio & border-radius sama) supaya tidak ada layout shift saat
       data datang; shimmer-nya pakai kelas global .skel (styles.scss). ---------- */
    .gallery-card-skel { aspect-ratio: 4 / 3; border-radius: 22px; }
    .gm-slide-skel { width: 100%; aspect-ratio: 4 / 3; border-radius: 22px; }

    /* ---------- Desktop: grid kartu overlay-foto ----------
       Foto full-bleed dalam bingkai potret (3:4) — lebih editorial/majalah
       dibanding kartu foto-atas+body-putih sebelumnya, dan memberi ruang
       scrim gradasi buat judul/meta melayang di atas foto tanpa kartu jadi
       lebih tinggi/berat. ---------- */
    .gallery-desktop-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .gallery-card { border-radius: 22px; }

    .gallery-card-media {
      position: relative;
      display: block;
      aspect-ratio: 4 / 3;
      border-radius: 22px;
      overflow: hidden;
      background: var(--color-bg-alt);
      box-shadow: var(--shadow-sm);
      text-decoration: none;
      transition: transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s cubic-bezier(.22,1,.36,1);
    }

    .gallery-card-media img {
      position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
      transition: transform .6s cubic-bezier(.22,1,.36,1);
    }

    /* Scrim gradasi bawah->atas — cukup gelap di bawah supaya teks putih
       selalu terbaca di atas foto apa pun, transparan penuh di 1/3 atas
       supaya foto tetap jadi elemen utama, bukan ketiban gelap semua. */
    .gallery-card-scrim {
      position: absolute; inset: 0; pointer-events: none;
      background: linear-gradient(to top, rgba(8,18,12,.92) 0%, rgba(8,18,12,.5) 34%, rgba(8,18,12,0) 62%);
      transition: opacity var(--motion-base) ease;
    }

    /* Kilau diagonal yang menyapu kartu saat hover — motif micro-interaction
       yang sama dipakai .tentang-feature::after (Beranda), dipakai ulang di
       sini supaya bahasa "kartu yang hidup saat disentuh" konsisten. */
    .gallery-card-shine {
      position: absolute; top: -20%; left: -60%; width: 40%; height: 140%;
      background: linear-gradient(115deg, transparent, rgba(255,255,255,.28), transparent);
      transform: skewX(-16deg); pointer-events: none; transition: left .7s ease;
    }

    .gallery-card-badges {
      position: absolute; top: 14px; left: 14px; z-index: 2;
      display: flex; flex-wrap: wrap; gap: 8px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      backdrop-filter: blur(8px);
      letter-spacing: 0.02em;
    }

    .badge-photos {
      background: rgba(15, 23, 42, 0.75);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .badge-video {
      background: rgba(220, 38, 38, 0.85);
      color: #fff;
    }

    .gallery-card-body {
      position: absolute; left: 0; right: 0; bottom: 0; z-index: 1;
      padding: 20px; color: #fff; display: flex; flex-direction: column;
    }

    .gallery-card-date {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: .72rem; font-weight: 600; opacity: .85; margin-bottom: 6px;
    }

    .gallery-card-tag {
      font-size: .72rem; font-weight: 700; letter-spacing: .03em; text-transform: uppercase;
      color: var(--color-primary-soft); margin-bottom: 4px;
    }

    .gallery-card-title {
      font-size: 1.12rem; font-weight: 800; font-family: var(--font-heading);
      line-height: 1.35; margin-bottom: 10px;
    }

    .gallery-card-cta {
      display: inline-flex; align-items: center; gap: 6px; width: fit-content;
      font-size: .8rem; font-weight: 700; color: #fff;
      opacity: 0; transform: translateY(6px);
      transition: opacity var(--motion-base) ease, transform var(--motion-base) ease;
    }

    @media (hover: hover) and (pointer: fine) {
      .gallery-card-media:hover {
        transform: translateY(-10px) scale(1.035);
        box-shadow: 0 30px 56px rgba(0,60,25,.28);
      }
      .gallery-card-media:hover img { transform: scale(1.12); }
      .gallery-card-media:hover .gallery-card-shine { left: 130%; }
      .gallery-card-media:hover .gallery-card-cta { opacity: 1; transform: translateY(0); }
    }

    /* ---------- Mobile: carousel scroll-snap + dots (disembunyikan di
       >=901px) — kartu tap membuka bottom sheet, bukan navigasi langsung.
       Struktur markup sama persis dengan Struktur Organisasi (gutter di
       wrapper bukan track, dot window bergeser). ---------- */
    .gallery-mobile-carousel { display: none; }
    .gm-track-wrap { margin: 0 -20px; padding: 0 24px; }
    .gm-track {
      display: flex; overflow-x: auto; gap: 16px; padding: 4px 0 16px;
      scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none;
    }
    .gm-track::-webkit-scrollbar { display: none; }
    .gm-slide { flex: 0 0 78%; scroll-snap-align: start; display: flex; }

    .gm-slide-card {
      position: relative; width: 100%; aspect-ratio: 4 / 3; border: none; padding: 0;
      background: none; cursor: pointer; -webkit-tap-highlight-color: transparent; text-align: left;
      border-radius: 22px; overflow: hidden; box-shadow: var(--shadow);
    }
    .gm-slide-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .gm-slide-scrim {
      position: absolute; inset: 0; pointer-events: none;
      background: linear-gradient(to top, rgba(8,18,12,.92) 0%, rgba(8,18,12,.45) 38%, rgba(8,18,12,0) 65%);
    }
    .gm-slide-badges { position: absolute; top: 12px; left: 12px; z-index: 2; display: flex; gap: 6px; }
    .gm-slide-body { position: absolute; left: 0; right: 0; bottom: 0; z-index: 1; padding: 16px; color: #fff; display: flex; flex-direction: column; }
    .gm-slide-date { display: inline-flex; align-items: center; gap: 5px; font-size: .68rem; font-weight: 600; opacity: .85; margin-bottom: 6px; }
    .gm-slide-title { font-size: 1rem; font-weight: 800; font-family: var(--font-heading); line-height: 1.32; margin-bottom: 8px; }
    .gm-slide-hint {
      display: inline-flex; align-items: center; gap: 5px; width: fit-content;
      font-size: .68rem; font-weight: 700; color: var(--color-gold); background: rgba(255,255,255,.14);
      padding: 4px 10px; border-radius: var(--radius-full);
    }

    .gm-dots { display: flex; justify-content: center; gap: 8px; margin-top: 4px; }
    .gm-dot { width: 8px; height: 8px; border-radius: var(--radius-full); border: none; background: var(--color-border-strong); padding: 0; cursor: pointer; transition: width .25s ease, background .25s ease, transform .25s ease, opacity .25s ease; }
    .gm-dot.active { width: 22px; background: var(--color-primary); }
    .gm-dot.edge:not(.active) { transform: scale(.5); opacity: .5; }

    @media (max-width: 900px) {
      .gallery-desktop-grid { display: none; }
      .gallery-mobile-carousel { display: block; }
    }

    /* ---------- Sheet preview: foto + badge + meta + deskripsi ----------
       Pola sama dengan previewSheet Beranda (.sheet-image/.sheet-title/
       .sheet-meta-row/.sheet-excerpt di home.index.page.ts) — didefinisikan
       ulang di sini karena Angular view encapsulation tidak membagikan style
       component-scoped lintas komponen. ---------- */
    .sheet-image { position: relative; margin: 0 0 14px; border-radius: 14px; overflow: hidden; }
    .sheet-image img { display: block; width: 100%; height: 220px; object-fit: cover; object-position: center top; }
    .sheet-image-badges { position: absolute; top: 10px; left: 10px; display: flex; gap: 6px; }
    .sheet-title { margin: 0 0 16px; }
    .sheet-meta-rows { margin: 0 0 20px; display: flex; flex-direction: column; gap: 12px; }
    .sheet-meta-row { display: flex; align-items: flex-start; gap: 10px; }
    .sheet-meta-icon {
      display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex-shrink: 0;
      border-radius: 8px; background: var(--color-primary-soft); color: var(--color-primary-dark);
    }
    .sheet-meta-label { display: block; font-size: .66rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--color-muted); }
    .sheet-meta-value { display: block; font-size: .88rem; font-weight: 600; color: var(--color-text); }
    .sheet-excerpt { margin: 0 0 4px; font-size: .88rem; line-height: 1.7; text-align: justify; color: var(--color-text-secondary); }
    .sheet-desc-skel { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }

    .pagination-wrapper {
      margin-top: 48px;
      display: flex;
      justify-content: center;
    }

    @media (max-width: 992px) {
      .gallery-desktop-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }
    }
  `],
})
export class GalleryPublicIndexPage implements OnInit, AfterViewInit {
  repo = inject(GalleryRepository);
  private api = inject(GalleryApiService);
  private router = inject(Router);

  limit = 9;
  currentSort = signal('newest');
  searchText = signal('');
  /** Nilai filter aktif — key cocok dengan FilterFieldDef.key (lihat
   *  filterFields()): 'year' & 'eventName'. */
  filterValues = signal<Record<string, unknown>>({});

  /** Opsi dropdown "Urutkan" — mengikuti persis referensi ldksyahid-app
   *  (Terbaru + Judul A-Z), lihat gallery_service_impl.go ListPublic untuk
   *  pemetaan "name" -> ORDER BY eventName ASC di backend. */
  readonly sortOptions: SortOptionDef[] = [
    { value: 'newest', label: 'Terbaru', icon: 'clock' },
    { value: 'name', label: 'Judul A-Z', icon: 'chevrons-up-down' },
  ];

  /** Field filter Galeri — data Galeri cuma punya eventName/eventDate, jadi
   *  Tahun Kegiatan & Nama Kegiatan (bukan Tema/Penulis/Editor ala referensi
   *  artikel, yang tidak relevan di sini). Opsinya distinct dari data yang
   *  benar-benar ada (repo.filterOptions(), lihat GalleryRepository), supaya
   *  dropdown tidak pernah menawarkan pilihan yang hasilnya kosong. */
  filterFields = computed<FilterFieldDef[]>(() => {
    const opts = this.repo.filterOptions();
    if (!opts) return [];
    return [
      {
        key: 'year',
        label: 'Tahun Kegiatan',
        icon: 'calendar-days',
        multiple: true,
        options: opts.years.map((y) => ({ value: y, label: String(y) })),
      },
      {
        key: 'eventName',
        label: 'Nama Kegiatan',
        icon: 'sitemap',
        multiple: true,
        options: opts.eventNames.map((n) => ({ value: n, label: n })),
      },
    ];
  });

  readonly skeletonItems = Array.from({ length: 6 }, (_, i) => i);

  /** Preview sheet mobile — item dasar tampil instan (sudah ada dari list),
   *  eventDescription baru ada di endpoint detail jadi di-fetch on-demand
   *  saat sheet dibuka (lihat openSheet()). Sengaja panggil GalleryApiService
   *  langsung (bukan GalleryRepository.loadPublicDetail), supaya TIDAK ikut
   *  menimpa repo.loading()/repo.error() — signal itu dipakai state loading
   *  grid utama, bukan buat preview sheet. */
  sheetItem = signal<GalleryListItem | null>(null);
  sheetDetail = signal<Gallery | null>(null);
  sheetLoading = signal(false);
  sheetError = signal(false);

  activeSlide = signal(0);
  @ViewChild('mobileTrack') private mobileTrackRef?: ElementRef<HTMLElement>;
  @ViewChild('sectionHead') private sectionHeadRef?: ElementRef<HTMLElement>;

  /** Indeks titik yang dirender — window geser selebar MAX_MOBILE_DOTS
   *  berpusat di slide aktif, sama seperti Struktur Organisasi. */
  dotIndices = computed(() => {
    const total = this.repo.publicGalleries().length;
    if (total <= MAX_MOBILE_DOTS) return Array.from({ length: total }, (_, i) => i);
    const half = Math.floor(MAX_MOBILE_DOTS / 2);
    const start = Math.max(0, Math.min(this.activeSlide() - half, total - MAX_MOBILE_DOTS));
    return Array.from({ length: MAX_MOBILE_DOTS }, (_, i) => start + i);
  });

  ngOnInit(): void {
    this.loadData();
    this.repo.loadFilterOptions();
  }

  ngAfterViewInit(): void {}

  loadData(page = this.repo.publicPage()): void {
    const filter = this.filterValues();
    this.repo.loadPublic(page, this.limit, this.currentSort(), {
      search: this.searchText(),
      year: filter['year'] as number[] | undefined,
      eventName: filter['eventName'] as string[] | undefined,
    });
    // Carousel mobile-nya SATU elemen #mobileTrack yang bertahan lintas
    // render (cuma isinya/@for yang diganti) — tanpa ini scrollLeft & dot
    // aktif dari halaman/filter SEBELUMNYA masih nempel begitu data baru
    // datang, jadi kartu pertama halaman baru muncul di posisi scroll acak
    // (bukan slide 0) — itu yang kelihatan "glitch". Direset di sini
    // (satu tempat, dipanggil semua jalur reload: search/filter/sort/page)
    // supaya track sudah di posisi 0 SEBELUM konten baru sempat dirender.
    this.activeSlide.set(0);
    if (this.mobileTrackRef?.nativeElement) this.mobileTrackRef.nativeElement.scrollLeft = 0;
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.loadData(1);
  }

  onFilterApply(values: Record<string, unknown>): void {
    this.filterValues.set(values);
    this.loadData(1);
  }

  onSortChange(sort: string): void {
    if (this.currentSort() === sort) return;
    this.currentSort.set(sort);
    this.loadData(1);
  }

  activeFilterCount(): number {
    return Object.values(this.filterValues()).reduce((sum: number, v) => {
      if (Array.isArray(v)) return sum + v.length;
      return v !== null && v !== undefined && v !== '' ? sum + 1 : sum;
    }, 0);
  }

  hasActiveSearchOrFilter(): boolean {
    return !!this.searchText() || this.activeFilterCount() > 0;
  }

  resetSearchAndFilter(): void {
    this.searchText.set('');
    this.filterValues.set({});
    this.loadData(1);
  }

  /** Ganti halaman lalu scroll ke judul section ("Koleksi Dokumentasi
   *  Kegiatan"), BUKAN ke offset piksel tetap — offset lama (top:120) sering
   *  masih nyangkut di tengah hero yang tinggi. -40px supaya judulnya tidak
   *  mepet banget ke navbar mengambang (position:fixed;top:14px) di atasnya. */
  onPageChange(newPage: number): void {
    this.loadData(newPage);
    const el = this.sectionHeadRef?.nativeElement;
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  isEdgeDot(i: number): boolean {
    const total = this.repo.publicGalleries().length;
    if (total <= MAX_MOBILE_DOTS) return false;
    const w = this.dotIndices();
    const first = w[0];
    const last = w[w.length - 1];
    return (i === first && first > 0) || (i === last && last < total - 1);
  }

  onMobileScroll(): void {
    const track = this.mobileTrackRef?.nativeElement;
    if (!track) return;
    const slideWidth = track.firstElementChild?.clientWidth || track.clientWidth;
    this.activeSlide.set(Math.round(track.scrollLeft / (slideWidth + 16)));
  }

  scrollToSlide(index: number): void {
    const track = this.mobileTrackRef?.nativeElement;
    if (!track) return;
    const slideWidth = track.firstElementChild?.clientWidth || track.clientWidth;
    track.scrollTo({ left: index * (slideWidth + 16), behavior: 'smooth' });
  }

  openSheet(item: GalleryListItem): void {
    this.sheetItem.set(item);
    this.sheetDetail.set(null);
    this.sheetError.set(false);
    this.sheetLoading.set(true);
    this.api.getPublic(item.galleryID).subscribe({
      next: (gallery) => {
        this.sheetDetail.set(gallery);
        this.sheetLoading.set(false);
      },
      error: () => {
        this.sheetError.set(true);
        this.sheetLoading.set(false);
      },
    });
  }

  closeSheet(): void {
    this.sheetItem.set(null);
  }

  goToSheetDetail(): void {
    const item = this.sheetItem();
    if (!item) return;
    this.router.navigate(['/tentang/galeri', item.galleryID]);
  }

  imgUrl = resolveImageUrl;
  thumbUrl = resolveThumbnailUrl;
}
