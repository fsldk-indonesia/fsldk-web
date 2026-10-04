import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogBook } from '../../entities/catalog-book';
import { BookCategory } from '../../entities/book-category';
import { BookLanguage } from '../../entities/book-language';
import { BookAuthorType } from '../../entities/book-author-type';
import { BookAvailabilityType } from '../../entities/book-availability-type';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { BottomSheetComponent } from '../../../../shared/bottom-sheet.component';
import { SearchFilterSortComponent, FilterFieldDef, SortOptionDef } from '../../../../shared/search-filter-sort.component';
import { resolveImageUrl, resolveThumbnailUrl } from '../../../../core/utils/image-url';
import { CatalogBookPublicIndexPresenter, emptyCatalogBookPublicFilter } from './catalogbook.public-index.presenter';
import { CatalogBookPublicIndexView } from './catalogbook.public-index.view';

/** Maksimum titik indikator carousel mobile yang tampak sekaligus — pola sama
 *  dengan Berita/Galeri/Struktur. */
const MAX_MOBILE_DOTS = 7;

const CURRENT_YEAR = new Date().getFullYear();
/** Opsi "Tahun Terbit" dibuat statis (30 tahun ke belakang), BUKAN dari
 *  endpoint distinct-years (belum ada) — cukup untuk filter yang lengkap
 *  tanpa perlu perubahan backend; app-select sudah punya kotak cari sendiri
 *  untuk daftar sepanjang ini (lihat [searchable] di search-filter-sort). */
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => String(CURRENT_YEAR - i)).map((y) => ({ value: y, label: y }));

const SORT_OPTIONS: SortOptionDef[] = [
  { value: 'newest', label: 'Terbaru', icon: 'clock' },
  { value: 'popular', label: 'Terpopuler', icon: 'heart' },
  { value: 'title', label: 'Judul A-Z', icon: 'chevrons-up-down' },
];

/**
 * Halaman publik Perpustakaan — hero reusable (shared/page-hero.component.ts),
 * bahasa visual sama dengan Berita/Galeri/Struktur/Kontak. Kartu listing
 * sengaja BEDA konsep dari ketiganya: "buku di rak" — sampul rasio 3/4
 * dengan efek tumpukan halaman (box-shadow berlapis) di sisi kanan-bawah +
 * pita kategori diagonal di pojok sampul, BUKAN ribbon mengambang (Berita)
 * atau foto full-bleed+scrim (Galeri). Filter kini multi-select penuh
 * (Kategori/Tipe Penulis/Ketersediaan/Bahasa/Tahun Terbit) — backend sudah
 * mendukung IN(...) untuk semua field ini (lihat catalogbook_repository.List),
 * cuma belum pernah dipakai UI lama yang single-select + tahun teks bebas.
 */
@Component({
  selector: 'app-catalogbook-public-index-page',
  standalone: true,
  imports: [RouterLink, IconComponent, PaginationComponent, PageHeroComponent, BottomSheetComponent, SearchFilterSortComponent],
  providers: [CatalogBookPublicIndexPresenter],
  template: `
    <app-page-hero
      badge="Perpustakaan Digital · FSLDK Indonesia"
      title="Jendela Ilmu,"
      titleAccent="Bacaan Pilihan Kader Dakwah"
      subtitle="Telusuri koleksi buku, catatan, dan referensi dakwah kampus untuk memperkaya wawasan dan menguatkan langkah perjuangan."
      quoteSource="hadith"
      waveColor="var(--color-primary)">
      <!-- Siluet sisi kanan hero: buku terbuka sebagai hub, garis jaringan
           menjalar ke titik-titik simpul ilmu — pola sama persis dengan
           "koran+jaringan" Berita, cuma motif tengahnya diganti buku terbuka
           + penanda halaman, selaras tema Perpustakaan. -->
      <div heroVisual class="hero-book-visual">
        <svg aria-hidden="true" viewBox="0 0 480 320" class="book-svg">
          <defs>
            <linearGradient id="bookSpineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--color-primary-bright)" />
              <stop offset="100%" stop-color="var(--color-primary)" />
            </linearGradient>
            <filter id="bookSoftBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>

          <g class="book-silhouette">
            <ellipse class="book-ground-shadow" cx="240" cy="252" rx="96" ry="10" filter="url(#bookSoftBlur)" />

            <!-- Halaman kiri -->
            <g transform="rotate(-7 240 190)">
              <rect x="150" y="122" width="92" height="126" rx="8" fill="#fff" stroke="var(--color-border)" stroke-width="1.5" />
              <rect x="164" y="140" width="58" height="5" rx="2.5" fill="var(--color-border-strong)" />
              <rect x="164" y="152" width="48" height="5" rx="2.5" fill="var(--color-border-strong)" />
              <rect x="164" y="164" width="54" height="5" rx="2.5" fill="var(--color-border-strong)" />
              <rect x="164" y="176" width="38" height="5" rx="2.5" fill="var(--color-border-strong)" />
              <rect x="164" y="196" width="54" height="38" rx="6" fill="var(--color-primary-soft)" />
            </g>

            <!-- Halaman kanan -->
            <g transform="rotate(7 240 190)">
              <rect x="238" y="122" width="92" height="126" rx="8" fill="#fff" stroke="var(--color-border)" stroke-width="1.5" />
              <rect x="256" y="140" width="58" height="5" rx="2.5" fill="var(--color-border-strong)" />
              <rect x="256" y="152" width="48" height="5" rx="2.5" fill="var(--color-border-strong)" />
              <rect x="256" y="164" width="54" height="5" rx="2.5" fill="var(--color-border-strong)" />
              <rect x="256" y="176" width="38" height="5" rx="2.5" fill="var(--color-border-strong)" />
              <rect x="256" y="196" width="40" height="6" rx="3" fill="var(--color-border-strong)" />
              <rect x="256" y="208" width="52" height="6" rx="3" fill="var(--color-border-strong)" />
            </g>

            <!-- Tulang buku (spine) + penanda halaman -->
            <rect x="233" y="118" width="14" height="134" rx="5" fill="url(#bookSpineFill)" />
            <path d="M236,118 L244,118 L244,150 L240,143 L236,150 Z" fill="var(--color-gold)" />
          </g>

          <!-- Garis "digambar sendiri" (lihat animateBookLines()) — dari
               punggung buku menjalar ke simpul-simpul ilmu, identik mekanisme
               Berita/Kontak/Struktur. -->
          <path #bookLine class="book-line thick" d="M240,120 L120,85" />
          <path #bookLine class="book-line thick" d="M240,120 L240,45" />
          <path #bookLine class="book-line thick" d="M240,120 L360,85" />
          <path #bookLine class="book-line" d="M120,85 L55,70" />
          <path #bookLine class="book-line" d="M120,85 L75,150" />
          <path #bookLine class="book-line" d="M240,45 L190,15" />
          <path #bookLine class="book-line" d="M240,45 L290,15" />
          <path #bookLine class="book-line" d="M360,85 L425,70" />
          <path #bookLine class="book-line" d="M360,85 L405,150" />

          <g class="book-tier book-tier-0">
            <circle class="network-ping" cx="240" cy="120" r="14" />
            <circle class="network-node" cx="240" cy="120" r="14" />
          </g>
          <g class="book-tier book-tier-1">
            <circle class="network-ping gold" cx="120" cy="85" r="10" style="animation-delay:.3s" />
            <circle class="network-node gold" cx="120" cy="85" r="10" />
            <circle class="network-ping gold" cx="240" cy="45" r="10" style="animation-delay:.6s" />
            <circle class="network-node gold" cx="240" cy="45" r="10" />
            <circle class="network-ping gold" cx="360" cy="85" r="10" style="animation-delay:.9s" />
            <circle class="network-node gold" cx="360" cy="85" r="10" />
          </g>
          <g class="book-tier book-tier-2">
            <circle class="network-node ember" cx="55" cy="70" r="6" />
            <circle class="network-node ember" cx="75" cy="150" r="6" />
            <circle class="network-node ember" cx="190" cy="15" r="6" />
            <circle class="network-node ember" cx="290" cy="15" r="6" />
            <circle class="network-node ember" cx="425" cy="70" r="6" />
            <circle class="network-node ember" cx="405" cy="150" r="6" />
          </g>

          <!-- Penanda "buku pilihan" — pop-in setelah jaringan tergambar. -->
          <g class="book-badge">
            <circle cx="315" cy="78" r="15" fill="#fff" stroke="var(--color-gold)" stroke-width="3" />
            <path d="M315,70 L317,76 L323,76 L318,80 L320,86 L315,82 L310,86 L312,80 L307,76 L313,76 Z" fill="var(--color-gold-dark)" />
          </g>
        </svg>
      </div>
    </app-page-hero>

    <!-- ---------- Section hijau penuh tepi-ke-tepi + siluet ikon raksasa
         pudar — pola sama persis dengan Berita, mewarnai SELURUH section. ---------- -->
    <section class="section">
      <span class="book-panel-silhouette" aria-hidden="true"><app-icon name="book-open" [size]="220" /></span>
      <span class="book-panel-silhouette-2" aria-hidden="true"><app-icon name="book" [size]="100" /></span>
      <div class="container pb-xl">
        <div class="book-section-head text-center reveal" #sectionHead>
          <h2>Koleksi Buku &amp; Referensi Dakwah</h2>
          <p class="book-section-subtitle">Ratusan judul buku, catatan kajian, dan referensi dakwah kampus dari jaringan FSLDK Indonesia — baca langsung atau unduh PDF-nya.</p>
        </div>

        <div class="book-toolbar">
          <app-search-filter-sort
            searchPlaceholder="Cari judul, penulis, atau penerbit..."
            [searchValue]="searchText()"
            [filterFields]="filterFields()"
            [filterValues]="filterValues()"
            [sortOptions]="sortOptions"
            [sortValue]="currentSort()"
            filterTitle="Filter Buku"
            filterSubtitle="Pilih satu atau lebih kriteria untuk menyaring koleksi buku."
            (searchChange)="onSearchChange($event)"
            (filterApply)="onFilterApply($event)"
            (sortChange)="onSortChange($event)"
          />
        </div>

        @if (loading()) {
          <!-- ---------- Skeleton — bentuk kartu ASLI (grid rak desktop /
               carousel mobile), supaya layout tidak "meloncat". ---------- -->
          <div class="book-desktop-grid" aria-hidden="true">
            @for (i of skeletonItems; track i) {
              <div class="book-card-skel">
                <span class="skel skel-thumb" style="aspect-ratio:3/4;border-radius:16px 16px 4px 4px"></span>
                <div class="book-card-skel-body">
                  <span class="skel skel-line" style="width:85%;height:16px"></span>
                  <span class="skel skel-line" style="width:55%"></span>
                  <span class="skel skel-line" style="width:40%;margin-top:6px"></span>
                </div>
              </div>
            }
          </div>
          <div class="book-mobile-carousel" aria-hidden="true">
            <div class="gm-track-wrap">
              <div class="gm-track">
                @for (i of skeletonItems; track i) {
                  <div class="gm-slide book-slide"><div class="book-slide-skel skel"></div></div>
                }
              </div>
            </div>
          </div>
        } @else if (items().length === 0 && hasActiveSearchOrFilter()) {
          <div class="empty-state book-empty-anim book-panel-slab">
            <span class="book-empty-icon book-empty-icon-badge">
              <app-icon name="search" [size]="26" />
            </span>
            <h3 class="book-empty-title">Buku Tidak Ditemukan</h3>
            <p class="book-empty-desc">Coba ubah kata kunci atau hapus filter yang aktif.</p>
            <div class="book-empty-suggestions">
              @if (searchText()) {
                <button type="button" class="chip" (click)="onSearchChange('')"><app-icon name="search" [size]="12" /> Coba kata kunci lebih umum</button>
              }
              @if (activeFilterCount() > 0) {
                <button type="button" class="chip" (click)="onFilterApply({})"><app-icon name="x" [size]="12" /> Hapus filter</button>
              }
              @if (searchText() && activeFilterCount() > 0) {
                <button type="button" class="chip" (click)="resetSearchAndFilter()"><app-icon name="rotate-ccw" [size]="12" /> Reset semua</button>
              }
            </div>
          </div>
        } @else if (items().length === 0) {
          <div class="empty-state book-empty-anim book-panel-slab">
            <div class="empty-icon book-empty-icon"><app-icon name="book-open" [size]="48" /></div>
            <h3 class="book-empty-title">Belum Ada Buku</h3>
            <p class="book-empty-desc">Koleksi buku akan muncul di sini setelah ditambahkan.</p>
          </div>
        } @else {
          <!-- ---------- Desktop: grid "rak buku" — sampul rasio 3/4 dengan
               efek tumpukan halaman (box-shadow berlapis) + pita kategori
               diagonal di pojok, hover = terangkat + tumpukan halaman
               "melebar" (kesan menarik buku dari rak). ---------- -->
          <div class="book-desktop-grid">
            @for (b of items(); track b.bookID; let i = $index) {
              <article class="book-card stagger-in" [style.--stagger-i]="i">
                <a [routerLink]="['/perpustakaan', b.bookSlug]" class="book-card-link">
                  <div class="book-cover-wrap">
                    <div class="book-cover">
                      @if (b.coverImage) {
                        <img [src]="thumbUrl(b.coverImage)" [alt]="b.bookTitle" loading="lazy" />
                      } @else {
                        <div class="book-cover-fallback"><app-icon name="book" [size]="30" /></div>
                      }
                      <span class="book-ribbon">{{ b.bookCategoryName }}</span>
                    </div>
                  </div>
                  <div class="book-card-body">
                    <h3 class="book-card-title">{{ b.bookTitle }}</h3>
                    <p class="book-card-author">{{ b.authorName }}</p>
                    <div class="book-card-meta">
                      <span class="book-card-meta-item"><app-icon name="calendar-days" [size]="11" /> {{ b.year }}</span>
                      <span class="book-card-meta-item"><app-icon name="check-circle" [size]="11" /> {{ b.availabilityTypeName }}</span>
                    </div>
                    <div class="book-card-foot">
                      <span class="book-card-fav"><app-icon name="heart" [size]="12" /> {{ b.favoriteCount }}</span>
                      <span class="book-card-cta">Lihat Buku <app-icon name="chevron-right" [size]="12" /></span>
                    </div>
                  </div>
                </a>
              </article>
            }
          </div>

          <!-- ---------- Mobile: carousel scroll-snap ala "rak buku" + dot
               indicator, tap kartu buka bottom sheet — pola sama dengan
               Berita/Galeri/Struktur. ---------- -->
          <div class="book-mobile-carousel">
            <div class="gm-track-wrap">
              <div class="gm-track" #mobileTrack (scroll)="onMobileScroll()">
                @for (b of items(); track b.bookID; let i = $index) {
                  <div class="gm-slide book-slide stagger-in" [style.--stagger-i]="i">
                    <button type="button" class="book-mobile-card" (click)="openSheet(b)">
                      <div class="book-cover-wrap">
                        <div class="book-cover">
                          @if (b.coverImage) {
                            <img [src]="thumbUrl(b.coverImage)" [alt]="b.bookTitle" loading="lazy" />
                          } @else {
                            <div class="book-cover-fallback"><app-icon name="book" [size]="26" /></div>
                          }
                          <span class="book-ribbon">{{ b.bookCategoryName }}</span>
                        </div>
                      </div>
                      <div class="book-card-body">
                        <h3 class="book-card-title">{{ b.bookTitle }}</h3>
                        <span class="book-mobile-hint"><app-icon name="eye" [size]="11" /> Ketuk untuk pratinjau</span>
                      </div>
                    </button>
                  </div>
                }
              </div>
            </div>

            @if (items().length > 1) {
              <div class="gm-dots">
                @for (i of dotIndices(); track i) {
                  <button type="button" class="gm-dot" [class.active]="activeSlide() === i" [class.edge]="isEdgeDot(i)" (click)="scrollToSlide(i)" [attr.aria-label]="'Slide ' + (i + 1)"></button>
                }
              </div>
            }
          </div>

          @if (count() > limit) {
            <div class="pagination-wrapper">
              <app-pagination
                [page]="page()"
                [count]="count()"
                [limit]="limit"
                itemLabel="buku"
                (pageChange)="onPageChange($event)"
              />
            </div>
          }
        }
      </div>
    </section>

    <!-- ---------- Bottom sheet mobile: preview buku ---------- -->
    <app-bottom-sheet
      [open]="sheetItem() !== null"
      (closed)="closeSheet()"
      ctaLabel="Lihat Detail Buku"
      (ctaClick)="goToSheetDetail()"
    >
      @if (sheetItem(); as b) {
        <div class="sheet-image">
          @if (b.coverImage) {
            <img [src]="thumbUrl(b.coverImage)" [alt]="b.bookTitle">
          } @else {
            <div class="book-cover-fallback sheet-image-fallback"><app-icon name="book" [size]="34" /></div>
          }
        </div>
        <span class="chip chip-green">{{ b.bookCategoryName }}</span>
        <h3 class="sheet-title">{{ b.bookTitle }}</h3>
        <div class="sheet-meta-rows">
          <div class="sheet-meta-row">
            <span class="sheet-meta-icon"><app-icon name="user-circle" [size]="13" /></span>
            <span><span class="sheet-meta-label">Penulis</span><span class="sheet-meta-value">{{ b.authorName }} &middot; {{ b.authorTypeName }}</span></span>
          </div>
          <div class="sheet-meta-row">
            <span class="sheet-meta-icon"><app-icon name="calendar-days" [size]="13" /></span>
            <span><span class="sheet-meta-label">Penerbit &amp; Tahun</span><span class="sheet-meta-value">{{ b.publisherName }} &middot; {{ b.year }}</span></span>
          </div>
          <div class="sheet-meta-row">
            <span class="sheet-meta-icon"><app-icon name="globe" [size]="13" /></span>
            <span><span class="sheet-meta-label">Bahasa &amp; Ketersediaan</span><span class="sheet-meta-value">{{ b.languageName }} &middot; {{ b.availabilityTypeName }}</span></span>
          </div>
          <div class="sheet-meta-row">
            <span class="sheet-meta-icon"><app-icon name="heart" [size]="13" /></span>
            <span><span class="sheet-meta-label">Disukai</span><span class="sheet-meta-value">{{ b.favoriteCount }} pembaca</span></span>
          </div>
        </div>
        <p class="sheet-excerpt">{{ b.description }}</p>
      }
    </app-bottom-sheet>
  `,
  styles: [`
    /* ---------- Siluet hero: buku terbuka + jaringan "digambar sendiri" —
       style projeksi [heroVisual] milik pemanggil (lihat komentar di
       template). Buku "tumbuh" dulu, lalu jaringan menyusul. ---------- */
    .hero-book-visual { position: relative; width: 100%; }
    .book-svg { position: relative; z-index: 1; width: 100%; height: 240px; overflow: visible; }

    .book-silhouette {
      transform-box: fill-box; transform-origin: 50% 100%; opacity: 0;
      animation: bookGrow .9s cubic-bezier(.34,1.4,.64,1) forwards;
      filter: drop-shadow(0 10px 18px rgba(0,147,59,.2));
    }
    @keyframes bookGrow { from { opacity: 0; transform: scale(.75) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .book-ground-shadow { fill: var(--color-primary-dark); opacity: .14; }
    @media (prefers-reduced-motion: reduce) { .book-silhouette { animation: none; opacity: 1; transform: none; } }

    .book-line { fill: none; stroke: var(--color-primary); stroke-width: 1.8; stroke-linecap: round; opacity: .55; }
    .book-line.thick { stroke-width: 2.6; opacity: .75; stroke: var(--color-primary-bright); }
    .book-tier { opacity: 0; animation: bookTierFadeIn .4s ease-out forwards; }
    .book-tier-0 { animation-delay: .75s; }
    .book-tier-1 { animation-delay: 1.3s; }
    .book-tier-2 { animation-delay: 1.8s; }
    @keyframes bookTierFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .book-badge {
      transform-box: fill-box; transform-origin: center; opacity: 0;
      animation: bookBadgePop .5s cubic-bezier(.34,1.4,.64,1) 2.2s forwards;
    }
    @keyframes bookBadgePop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: scale(1); } }
    @media (prefers-reduced-motion: reduce) { .book-tier, .book-badge { animation: none; opacity: 1; transform: none; } }

    /* ---------- Section hijau PENUH tepi-ke-tepi — pola sama persis Berita. ---------- */
    .section { position: relative; overflow: hidden; background: var(--color-primary); min-height: 60vh; padding: 56px 0 72px; }
    .book-panel-silhouette { position: absolute; right: 8px; bottom: 8px; z-index: 0; color: rgba(255,255,255,.12); transform: rotate(-12deg); pointer-events: none; }
    .book-panel-silhouette-2 { position: absolute; left: 8px; top: 8px; z-index: 0; color: rgba(255,255,255,.08); transform: rotate(16deg); pointer-events: none; }
    .section > .container { position: relative; z-index: 1; }

    .book-section-head { margin-bottom: 28px; }
    .book-section-head h2 { margin: 14px 0 10px; color: #fff; }
    .book-section-subtitle { max-width: 560px; margin: 0 auto; color: rgba(255,255,255,.85); font-size: 1.02rem; line-height: 1.6; }

    .book-panel-slab { background: #fff; border-radius: var(--radius-md); }

    .book-toolbar { max-width: 900px; margin: 0 auto 32px; }
    ::ng-deep .book-toolbar .sfs-btn-filter { background: #fff !important; color: var(--color-primary-dark) !important; }
    ::ng-deep .book-toolbar .sfs-btn-filter app-icon { color: var(--color-primary-dark) !important; }
    ::ng-deep .book-toolbar .sfs-btn-filter:hover { background: var(--color-primary-soft) !important; }
    ::ng-deep .book-toolbar .sfs-count { box-shadow: 0 0 0 2px var(--color-primary); }
    ::ng-deep .book-toolbar .sfs-active-chip { background: #fff; color: var(--color-primary-dark); box-shadow: var(--shadow-sm); }
    ::ng-deep .book-toolbar .sfs-active-chip button { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    ::ng-deep .book-toolbar .sfs-active-chip button:hover { background: var(--color-primary); color: #fff; }

    @media (max-width: 640px) { .section { padding: 40px 0 56px; } }

    /* ---------- Animasi state "tidak ada data". ---------- */
    .book-empty-anim { animation: bookEmptyFadeIn .5s var(--ease-out) both; }
    @keyframes bookEmptyFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
    .book-empty-icon { position: relative; animation: bookEmptyIconPop .5s var(--ease-out) .1s both, bookEmptyIconFloat 3.2s ease-in-out .6s infinite; }
    @keyframes bookEmptyIconPop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: scale(1); } }
    @keyframes bookEmptyIconFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    .book-empty-icon-badge {
      display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px;
      border-radius: 50%; margin: 0 auto 14px; color: #fff;
      background: linear-gradient(150deg, var(--color-primary-bright), var(--color-primary));
      box-shadow: 0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent);
    }
    .book-empty-title, .book-empty-desc { animation: bookEmptyFadeIn .5s var(--ease-out) both; }
    .book-empty-title { animation-delay: .18s; }
    .book-empty-desc { animation-delay: .28s; }
    .book-empty-suggestions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 6px; animation: bookEmptyFadeIn .5s var(--ease-out) .4s both; }
    .book-empty-suggestions .chip { display: inline-flex; align-items: center; gap: 6px; transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease, background var(--motion-fast) ease, color var(--motion-fast) ease; }
    .book-empty-suggestions .chip:hover { transform: translateY(-3px); box-shadow: var(--shadow-sm); background: var(--color-primary-soft); color: var(--color-primary-dark); }
    @media (prefers-reduced-motion: reduce) { .book-empty-anim, .book-empty-icon, .book-empty-title, .book-empty-desc, .book-empty-suggestions { animation: none; opacity: 1; transform: none; } }

    /* ---------- Skeleton loading — bentuk kartu asli. ---------- */
    .book-card-skel { border-radius: 20px; overflow: hidden; background: #fff; border: 1px solid var(--color-border); }
    .book-card-skel-body { padding: 18px; display: flex; flex-direction: column; gap: 10px; }
    .book-slide-skel { width: 100%; aspect-ratio: 3 / 4.6; border-radius: 20px; }

    /* ---------- Desktop: grid "rak buku" ----------
       Sampul rasio 3/4 dengan efek tumpukan halaman (box-shadow berlapis
       mengikuti border-radius sampul) + pita kategori diagonal di pojok —
       BUKAN ribbon mengambang (Berita) atau foto full-bleed+scrim (Galeri).
       Hover = terangkat + tumpukan halaman "melebar" (kesan menarik buku
       dari rak), foto zoom halus. ---------- */
    .book-desktop-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 26px; max-width: 1240px; margin: 0 auto; }

    .book-card { border-radius: 20px; }
    .book-card-link {
      position: relative; display: flex; flex-direction: column; height: 100%;
      background: #fff; border-radius: 20px; padding: 16px 16px 18px; overflow: visible;
      border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);
      text-decoration: none; color: inherit;
      transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s cubic-bezier(.22,1,.36,1), border-color .35s ease;
    }

    /* Ruang kanan-bawah sengaja disisakan (margin) untuk tumpukan
       box-shadow "halaman" supaya tidak terpotong oleh tepi kartu. */
    .book-cover-wrap { margin: 0 8px 10px 0; }
    .book-cover {
      position: relative; aspect-ratio: 3 / 4; overflow: hidden;
      border-radius: 14px 14px 5px 5px; background: var(--color-primary-soft);
      box-shadow: 4px 4px 0 0 var(--color-bg-alt), 8px 8px 0 0 var(--color-border);
      transition: box-shadow .35s cubic-bezier(.22,1,.36,1);
    }
    .book-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .6s cubic-bezier(.22,1,.36,1); }
    .book-cover-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-primary); background: var(--color-primary-soft); }

    /* Pita kategori diagonal di pojok kiri-atas sampul — teknik "ribbon
       corner" klasik: lebih lebar dari yang kelihatan, dirotasi, ujungnya
       dipotong rapi oleh overflow:hidden + border-radius milik .book-cover. */
    .book-ribbon {
      position: absolute; top: 10px; left: -32px; z-index: 2; width: 130px;
      text-align: center; transform: rotate(-45deg); transform-origin: center;
      background: linear-gradient(135deg, var(--color-primary-bright), var(--color-primary));
      color: #fff; font-size: .66rem; font-weight: 800; letter-spacing: .02em;
      padding: 4px 0; box-shadow: 0 3px 8px rgba(0,0,0,.18);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    .book-card-body { position: relative; flex: 1; display: flex; flex-direction: column; padding-top: 2px; }
    .book-card-title {
      margin: 0 0 4px; font-size: .96rem; font-weight: 800; font-family: var(--font-heading);
      line-height: 1.35; color: var(--color-text);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .book-card-author { margin: 0 0 10px; font-size: .8rem; color: var(--color-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .book-card-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
    .book-card-meta-item { display: inline-flex; align-items: center; gap: 4px; font-size: .72rem; color: var(--color-muted); font-weight: 600; }

    .book-card-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 10px; border-top: 1px dashed var(--color-border); }
    .book-card-fav { display: inline-flex; align-items: center; gap: 5px; font-size: .78rem; font-weight: 700; color: var(--color-text-secondary); }
    .book-card-cta { display: inline-flex; align-items: center; gap: 4px; font-size: .78rem; font-weight: 700; color: var(--color-primary); transition: gap .25s ease, color .25s ease; }

    @media (hover: hover) and (pointer: fine) {
      .book-card-link:hover { transform: translateY(-8px); box-shadow: 0 20px 42px rgba(0,60,25,.14), 0 0 0 2px var(--color-primary-bright); border-color: transparent; }
      .book-card-link:hover .book-cover { box-shadow: 6px 6px 0 0 var(--color-bg-alt), 12px 12px 0 0 var(--color-border); }
      .book-card-link:hover .book-cover img { transform: scale(1.08); }
      .book-card-link:hover .book-card-cta { gap: 8px; color: var(--color-primary-dark); }
    }

    /* ---------- Mobile: carousel scroll-snap ala rak buku + dots. ---------- */
    .book-mobile-carousel { display: none; }
    .gm-track-wrap { margin: 0 -20px; padding: 0 24px; }
    .gm-track { display: flex; overflow-x: auto; gap: 16px; padding: 4px 0 16px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .gm-track::-webkit-scrollbar { display: none; }
    .book-slide { flex: 0 0 48%; scroll-snap-align: start; display: flex; }

    .book-mobile-card {
      position: relative; width: 100%; display: flex; flex-direction: column;
      border: none; padding: 14px 14px 16px; margin: 0; background: #fff; cursor: pointer; text-align: left;
      border-radius: 20px; overflow: visible; box-shadow: var(--shadow);
      -webkit-tap-highlight-color: transparent;
    }
    .book-mobile-card .book-card-title { margin-bottom: 8px; }
    .book-mobile-hint {
      display: inline-flex; align-items: center; gap: 5px; width: fit-content;
      font-size: .66rem; font-weight: 700; color: var(--color-primary-dark);
      background: var(--color-primary-soft); padding: 4px 9px; border-radius: var(--radius-full);
    }

    .gm-dots { display: flex; justify-content: center; gap: 8px; margin-top: 4px; }
    /* Dot di atas section HIJAU SOLID — base putih tembus pandang + aktif
       putih padat (BUKAN var(--color-primary): itu identik warna section
       itu sendiri, jadi dot aktif malah nyaris hilang). Pola sama dengan
       override toolbar/pagination putih di section ini. */
    .gm-dot { width: 8px; height: 8px; border-radius: var(--radius-full); border: none; background: rgba(255,255,255,.4); padding: 0; cursor: pointer; transition: width .25s ease, background .25s ease, transform .25s ease, opacity .25s ease; }
    .gm-dot.active { width: 22px; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.2); }
    .gm-dot.edge:not(.active) { transform: scale(.5); opacity: .5; }

    @media (max-width: 900px) { .book-desktop-grid { display: none; } .book-mobile-carousel { display: block; } }
    @media (max-width: 992px) and (min-width: 901px) { .book-desktop-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; } }
    @media (max-width: 480px) { .book-slide { flex: 0 0 62%; } }

    /* ---------- Sheet preview: sampul + badge + meta + ringkasan. ---------- */
    .sheet-image { position: relative; margin: 0 0 14px; border-radius: 14px; overflow: hidden; }
    .sheet-image img { display: block; width: 100%; height: 240px; object-fit: cover; object-position: center top; }
    .sheet-image-fallback { position: relative; height: 240px; }
    .sheet-title { margin: 0 0 16px; }
    .sheet-meta-rows { margin: 0 0 20px; display: flex; flex-direction: column; gap: 12px; }
    .sheet-meta-row { display: flex; align-items: flex-start; gap: 10px; }
    .sheet-meta-icon { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex-shrink: 0; border-radius: 8px; background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .sheet-meta-label { display: block; font-size: .66rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--color-muted); }
    .sheet-meta-value { display: block; font-size: .88rem; font-weight: 600; color: var(--color-text); }
    .sheet-excerpt { margin: 0 0 4px; font-size: .88rem; line-height: 1.7; text-align: justify; color: var(--color-text-secondary); display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }

    .pagination-wrapper { margin-top: 48px; display: flex; justify-content: center; }
    ::ng-deep .pagination-wrapper .pgn-info { color: rgba(255,255,255,.8) !important; }
    ::ng-deep .pagination-wrapper .pgn-info strong { color: #fff !important; }
  `],
})
export class CatalogBookPublicIndexPage implements OnInit, AfterViewInit, OnDestroy, CatalogBookPublicIndexView {
  private presenter = inject(CatalogBookPublicIndexPresenter);
  private router = inject(Router);

  items = signal<CatalogBook[]>([]);
  categories = signal<BookCategory[]>([]);
  languages = signal<BookLanguage[]>([]);
  authorTypes = signal<BookAuthorType[]>([]);
  availabilityTypes = signal<BookAvailabilityType[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 12;

  searchText = signal('');
  currentSort = signal('newest');
  filterValues = signal<Record<string, unknown>>({});
  readonly sortOptions = SORT_OPTIONS;

  /** Field filter — SEMUA multi-select, data-driven dari lookups (kecuali
   *  Tahun Terbit yang statis, lihat YEAR_OPTIONS). Field lookup baru
   *  tampil setelah datanya termuat, supaya tidak "berkedip" kosong dulu. */
  filterFields = computed<FilterFieldDef[]>(() => {
    const fields: FilterFieldDef[] = [];
    if (this.categories().length) {
      fields.push({ key: 'bookCategoryID', label: 'Kategori', icon: 'tags', multiple: true, options: this.categories().map((c) => ({ value: c.bookCategoryID, label: c.bookCategoryName })) });
    }
    if (this.authorTypes().length) {
      fields.push({ key: 'authorTypeID', label: 'Tipe Penulis', icon: 'user-circle', multiple: true, options: this.authorTypes().map((t) => ({ value: t.authorTypeID, label: t.authorTypeName })) });
    }
    if (this.availabilityTypes().length) {
      fields.push({ key: 'availabilityTypeID', label: 'Ketersediaan', icon: 'check-circle', multiple: true, options: this.availabilityTypes().map((t) => ({ value: t.availabilityTypeID, label: t.availabilityTypeName })) });
    }
    if (this.languages().length) {
      fields.push({ key: 'languageID', label: 'Bahasa', icon: 'globe', multiple: true, options: this.languages().map((l) => ({ value: l.languageID, label: l.languageName })) });
    }
    fields.push({ key: 'year', label: 'Tahun Terbit', icon: 'calendar-days', multiple: true, options: YEAR_OPTIONS });
    return fields;
  });

  readonly skeletonItems = Array.from({ length: 8 }, (_, i) => i);

  sheetItem = signal<CatalogBook | null>(null);
  activeSlide = signal(0);

  @ViewChild('mobileTrack') private mobileTrackRef?: ElementRef<HTMLElement>;
  @ViewChild('sectionHead') private sectionHeadRef?: ElementRef<HTMLElement>;
  @ViewChildren('bookLine') private bookLineRefs!: QueryList<ElementRef<SVGPathElement>>;

  dotIndices = computed(() => {
    const total = this.items().length;
    if (total <= MAX_MOBILE_DOTS) return Array.from({ length: total }, (_, i) => i);
    const half = Math.floor(MAX_MOBILE_DOTS / 2);
    const start = Math.max(0, Math.min(this.activeSlide() - half, total - MAX_MOBILE_DOTS));
    return Array.from({ length: MAX_MOBILE_DOTS }, (_, i) => start + i);
  });

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadLookups();
    this.loadData();
    /* Section di halaman ini berakhir hijau solid — ruang negatif wave
       footer perlu diisi hijau khusus di sini, pola sama persis Berita. */
    document.documentElement.style.setProperty('--footer-wave-backdrop', 'var(--color-primary)');
  }

  ngAfterViewInit(): void {
    this.animateBookLines();
  }

  ngOnDestroy(): void {
    document.documentElement.style.removeProperty('--footer-wave-backdrop');
  }

  loadData(page = this.page()): void {
    const filter = this.filterValues();
    this.page.set(page);
    this.presenter.load(page, this.limit, this.searchText(), this.currentSort(), {
      bookCategoryID: filter['bookCategoryID'] as number[] | undefined,
      authorTypeID: filter['authorTypeID'] as number[] | undefined,
      availabilityTypeID: filter['availabilityTypeID'] as number[] | undefined,
      languageID: filter['languageID'] as number[] | undefined,
      year: filter['year'] as string[] | undefined,
    });
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
    const total = this.items().length;
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

  openSheet(item: CatalogBook): void {
    this.sheetItem.set(item);
  }

  closeSheet(): void {
    this.sheetItem.set(null);
  }

  goToSheetDetail(): void {
    const item = this.sheetItem();
    if (!item) return;
    this.router.navigate(['/perpustakaan', item.bookSlug]);
  }

  /** Efek "jaringan digambar sendiri" — identik animateNewsLines() (Berita). */
  private animateBookLines(): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.bookLineRefs?.forEach((ref, i) => {
      const path = ref.nativeElement;
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      if (reduced) { path.style.strokeDashoffset = '0'; return; }
      path.animate(
        [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
        { duration: 600, delay: 700 + i * 130, easing: 'ease-out', fill: 'forwards' },
      );
    });
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setBooks(books: CatalogBook[], count: number): void { this.items.set(books); this.count.set(count); }
  setCategories(categories: BookCategory[]): void { this.categories.set(categories); }
  setLanguages(languages: BookLanguage[]): void { this.languages.set(languages); }
  setAuthorTypes(types: BookAuthorType[]): void { this.authorTypes.set(types); }
  setAvailabilityTypes(types: BookAvailabilityType[]): void { this.availabilityTypes.set(types); }

  imgUrl = resolveImageUrl;
  thumbUrl = resolveThumbnailUrl;
}
