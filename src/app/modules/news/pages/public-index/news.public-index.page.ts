import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NewsRepository } from '../../repositories/news.repository';
import { News } from '../../entities/news';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { BottomSheetComponent } from '../../../../shared/bottom-sheet.component';
import { SearchFilterSortComponent, FilterFieldDef, SortOptionDef } from '../../../../shared/search-filter-sort.component';
import { resolveImageUrl, resolveThumbnailUrl } from '../../../../core/utils/image-url';

/** Maksimum titik indikator carousel mobile yang tampak sekaligus — sisanya
 *  digulung lewat window geser, pola sama seperti Galeri/Struktur. */
const MAX_MOBILE_DOTS = 7;

/**
 * Public landing page for browsing news. Hero publik reusable
 * (shared/page-hero.component.ts) — bahasa visual sama dengan Galeri/Struktur/
 * Kontak. Kartu listing sengaja BEDA konsep dari Galeri (editorial/majalah:
 * badan putih + ribbon kategori mengambang, bukan foto full-bleed + scrim
 * gelap) — Berita adalah konten BACAAN, bukan portofolio visual.
 */
@Component({
  selector: 'app-news-public-index-page',
  standalone: true,
  imports: [RouterLink, DatePipe, IconComponent, PaginationComponent, PageHeroComponent, BottomSheetComponent, SearchFilterSortComponent],
  template: `
    <app-page-hero
      badge="Berita & Kabar Dakwah Kampus · FSLDK Indonesia"
      title="Kabar Terkini,"
      titleAccent="Gerakan Dakwah Kampus"
      subtitle="Ikuti perkembangan, kegiatan, dan pencapaian jaringan dakwah kampus se-Indonesia dari waktu ke waktu."
      quoteSource="quran">
      <!-- Siluet sisi kanan hero: koran terlipat sebagai hub, garis jaringan
           menjalar ke titik-titik LDK (konsisten "Peta Silaturahmi" — primitif
           global .network-line/.network-node/.network-ping, styles.scss),
           melambangkan kabar yang menyebar ke seluruh jaringan dakwah kampus. -->
      <div heroVisual class="hero-news-paper">
        <svg aria-hidden="true" viewBox="0 0 480 320" class="news-svg">
          <defs>
            <linearGradient id="newsMastheadFill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="var(--color-primary-bright)" />
              <stop offset="100%" stop-color="var(--color-primary)" />
            </linearGradient>
            <filter id="newsSoftBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>

          <g class="news-paper-silhouette">
            <ellipse class="news-ground-shadow" cx="240" cy="250" rx="90" ry="10" filter="url(#newsSoftBlur)" />

            <!-- Halaman kedua mengintip di belakang (kesan tumpukan koran) -->
            <g transform="rotate(6 300 150)">
              <rect x="190" y="90" width="128" height="156" rx="10" fill="#fff" stroke="var(--color-border)" />
            </g>

            <!-- Koran utama, sedikit miring untuk kesan dinamis -->
            <g transform="rotate(-6 230 150)">
              <rect class="news-paper-body" x="165" y="78" width="140" height="160" rx="10" fill="#fff" stroke="var(--color-border)" stroke-width="1.5" />
              <path class="news-masthead" d="M165,88 a10,10 0 0 1 10,-10 L295,78 a10,10 0 0 1 10,10 L305,106 L165,106 Z" fill="url(#newsMastheadFill)" />
              <circle cx="180" cy="92" r="5" fill="#fff" opacity=".9" />
              <rect x="192" y="88" width="62" height="4" rx="2" fill="#fff" opacity=".85" />
              <rect x="192" y="96" width="42" height="3" rx="1.5" fill="#fff" opacity=".6" />

              <rect x="178" y="166" width="48" height="48" rx="6" fill="var(--color-primary-soft)" />
              <rect x="234" y="170" width="60" height="6" rx="3" fill="var(--color-border-strong)" />
              <rect x="234" y="182" width="52" height="6" rx="3" fill="var(--color-border-strong)" />
              <rect x="234" y="194" width="44" height="6" rx="3" fill="var(--color-border-strong)" />
              <rect x="178" y="224" width="114" height="6" rx="3" fill="var(--color-border-strong)" />
              <rect x="178" y="236" width="90" height="6" rx="3" fill="var(--color-border-strong)" />
            </g>
          </g>

          <!-- Garis "digambar sendiri" (lihat animateNewsLines()) — jalur utama
               (koran -> hub daerah) lebih tebal/terang dari jalur turunan
               (hub daerah -> LDK), identik pembagian tier di Struktur/Kontak. -->
          <path #newsLine class="news-line thick" d="M235,160 L120,85" />
          <path #newsLine class="news-line thick" d="M235,160 L240,45" />
          <path #newsLine class="news-line thick" d="M235,160 L360,85" />
          <path #newsLine class="news-line" d="M120,85 L55,70" />
          <path #newsLine class="news-line" d="M120,85 L75,150" />
          <path #newsLine class="news-line" d="M240,45 L190,15" />
          <path #newsLine class="news-line" d="M240,45 L290,15" />
          <path #newsLine class="news-line" d="M360,85 L425,70" />
          <path #newsLine class="news-line" d="M360,85 L405,150" />

          <g class="news-tier news-tier-0">
            <circle class="network-ping" cx="235" cy="160" r="14" />
            <circle class="network-node" cx="235" cy="160" r="14" />
          </g>
          <g class="news-tier news-tier-1">
            <circle class="network-ping gold" cx="120" cy="85" r="10" style="animation-delay:.3s" />
            <circle class="network-node gold" cx="120" cy="85" r="10" />
            <circle class="network-ping gold" cx="240" cy="45" r="10" style="animation-delay:.6s" />
            <circle class="network-node gold" cx="240" cy="45" r="10" />
            <circle class="network-ping gold" cx="360" cy="85" r="10" style="animation-delay:.9s" />
            <circle class="network-node gold" cx="360" cy="85" r="10" />
          </g>
          <g class="news-tier news-tier-2">
            <circle class="network-node ember" cx="55" cy="70" r="6" />
            <circle class="network-node ember" cx="75" cy="150" r="6" />
            <circle class="network-node ember" cx="190" cy="15" r="6" />
            <circle class="network-node ember" cx="290" cy="15" r="6" />
            <circle class="network-node ember" cx="425" cy="70" r="6" />
            <circle class="network-node ember" cx="405" cy="150" r="6" />
          </g>

          <!-- Penanda "kabar baru" — pop-in setelah seluruh jaringan tergambar. -->
          <g class="news-badge">
            <circle cx="312" cy="78" r="15" fill="#fff" stroke="var(--color-gold)" stroke-width="3" />
            <path d="M312,70 L314,76 L320,76 L315,80 L317,86 L312,82 L307,86 L309,80 L304,76 L310,76 Z" fill="var(--color-gold-dark)" />
          </g>
        </svg>
      </div>
    </app-page-hero>

    <!-- ---------- Transisi hero -> section hijau. Bukan wave KEDUA yang
         ditempel di tepi atas section (itu kebuat dua wave beda warna/bentuk
         bertabrakan, makanya masih "putus"), tapi elemen ANTARA hero dan
         section: 10px atasnya rata & berwarna tint PERSIS sama dengan warna
         .hero-wave (jahitan tint-ke-tint tanpa garis), lalu wave hijau ada
         di bawahnya yang jahitannya ke .section juga rata hijau-ke-hijau.
         Satu-satunya wave yang tampak di zona ini. ---------- -->
    <div class="hero-to-section-transition" aria-hidden="true">
      <svg viewBox="0 0 2880 80" preserveAspectRatio="none">
        <path d="M0,40 C240,70 480,10 720,40 C960,70 1200,10 1440,40 C1680,70 1920,10 2160,40 C2400,70 2640,10 2880,40 L2880,80 L0,80 Z" />
      </svg>
    </div>

    <!-- ---------- Section hijau penuh tepi-ke-tepi + siluet ikon raksasa
         pudar — pola sama persis dengan .agenda-panel (section Event) di
         Beranda, tapi di sini mewarnai SELURUH section (judul, toolbar,
         daftar berita, pagination), bukan cuma panel bulat mengambang di
         tengahnya. Dua siluet koran (besar di pojok kanan-bawah, kecil di
         kiri-atas) nempel ke section itu sendiri. ---------- -->
    <section class="section">
      <span class="news-panel-silhouette" aria-hidden="true"><app-icon name="newspaper" [size]="220" /></span>
      <span class="news-panel-silhouette-2" aria-hidden="true"><app-icon name="newspaper" [size]="100" /></span>
      <div class="container pb-xl">
        <div class="news-section-head text-center reveal" #sectionHead>
          <h2>Kabar &amp; Liputan Terbaru</h2>
          <p class="news-section-subtitle">Rangkuman kegiatan, pencapaian, dan cerita dari jaringan dakwah kampus FSLDK Indonesia se-Nusantara.</p>
        </div>

        <!-- Search + Filter + Urutkan — komponen global (shared/search-filter-sort.component.ts). -->
        <div class="news-toolbar">
          <app-search-filter-sort
            searchPlaceholder="Cari berita berdasarkan judul atau isi..."
            [searchValue]="searchText()"
            [filterFields]="filterFields()"
            [filterValues]="filterValues()"
            [sortOptions]="sortOptions"
            [sortValue]="currentSort()"
            filterTitle="Filter Berita"
            filterSubtitle="Pilih kategori untuk menyaring berita."
            (searchChange)="onSearchChange($event)"
            (filterApply)="onFilterApply($event)"
            (sortChange)="onSortChange($event)"
          />
        </div>

        @if (repo.loading()) {
          <!-- ---------- Skeleton loading — bentuk kartu ASLI (editorial grid
               desktop / carousel mobile), supaya layout tidak "meloncat". ---------- -->
          <div class="news-desktop-grid" aria-hidden="true">
            @for (i of skeletonItems; track i) {
              <div class="news-card-skel">
                <span class="skel skel-thumb" style="aspect-ratio:16/10;border-radius:0"></span>
                <div class="news-card-skel-body">
                  <span class="skel skel-line" style="width:70%;height:18px"></span>
                  <span class="skel skel-line" style="width:100%"></span>
                  <span class="skel skel-line" style="width:50%"></span>
                </div>
              </div>
            }
          </div>
          <div class="news-mobile-carousel" aria-hidden="true">
            <div class="gm-track-wrap">
              <div class="gm-track">
                @for (i of skeletonItems; track i) {
                  <div class="gm-slide"><div class="gm-slide-skel skel"></div></div>
                }
              </div>
            </div>
          </div>
        } @else if (repo.error()) {
          <!-- Slab putih — state error/kosong butuh teks gelap tetap terbaca
               di atas panel hijau, bukan diwarnai ulang satu-satu. -->
          <div class="empty-state news-panel-slab">
            <div class="empty-icon text-danger"><app-icon name="alert-triangle" [size]="48" /></div>
            <h3>Terjadi Kesalahan</h3>
            <p>{{ repo.error() }}</p>
            <button class="btn btn-outline mt-md" (click)="loadData()">Coba Lagi</button>
          </div>
        } @else if (repo.publicNews().length === 0 && hasActiveSearchOrFilter()) {
          <div class="empty-state news-empty-anim news-panel-slab">
            <span class="news-empty-icon news-empty-icon-badge">
              <app-icon name="search" [size]="26" />
            </span>
            <h3 class="news-empty-title">Berita Tidak Ditemukan</h3>
            <p class="news-empty-desc">Coba ubah kata kunci atau hapus filter kategori yang aktif.</p>
            <div class="news-empty-suggestions">
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
        } @else if (repo.publicNews().length === 0) {
          <div class="empty-state news-empty-anim news-panel-slab">
            <div class="empty-icon news-empty-icon"><app-icon name="newspaper" [size]="48" /></div>
            <h3 class="news-empty-title">Belum Ada Berita</h3>
            <p class="news-empty-desc">Berita yang dipublikasikan akan muncul di sini.</p>
          </div>
        } @else {
          <!-- ---------- Desktop: grid kartu editorial — badan putih dengan
               ribbon kategori mengambang (separuh di foto, separuh di body),
               hover = lift + garis aksen atas, BUKAN foto full-bleed + scrim
               gelap seperti Galeri (konsep sengaja dibedakan, Berita adalah
               konten bacaan bukan portofolio visual). ---------- -->
          <div class="news-desktop-grid">
            @for (item of repo.publicNews(); track item.newsID; let i = $index) {
              <article class="news-card stagger-in" [style.--stagger-i]="i">
                <a [routerLink]="['/berita', item.newsSlug]" class="news-card-link">
                  <div class="news-card-media">
                    @if (item.newsImage) {
                      <img [src]="thumbUrl(item.newsImage)" [alt]="item.newsTitle" loading="lazy" />
                    } @else {
                      <div class="news-card-media-fallback"><app-icon name="newspaper" [size]="30" /></div>
                    }
                    @if (item.isFeatured) {
                      <span class="news-card-featured"><app-icon name="star" [size]="11" /> Unggulan</span>
                    }
                  </div>
                  <div class="news-card-body">
                    <span class="news-card-cat">{{ item.categoryName }}</span>
                    <h3 class="news-card-title">{{ item.newsTitle }}</h3>
                    <p class="news-card-excerpt">{{ item.newsExcerpt }}</p>
                    <div class="news-card-meta">
                      <span class="news-card-meta-item"><app-icon name="user-circle" [size]="12" /> {{ item.newsReporter || item.authorName }}</span>
                      @if (item.publishedDate) {
                        <span class="news-card-meta-item"><app-icon name="calendar-days" [size]="12" /> {{ item.publishedDate | date: 'd MMM y' }}</span>
                      }
                      <span class="news-card-meta-item"><app-icon name="eye" [size]="12" /> {{ item.viewCount }}</span>
                    </div>
                    <span class="news-card-cta">Baca Selengkapnya <app-icon name="chevron-right" [size]="13" /></span>
                  </div>
                </a>
              </article>
            }
          </div>

          <!-- ---------- Mobile: carousel scroll-snap + dot indicator, tap
               kartu buka bottom sheet (bukan langsung pindah halaman) — pola
               sama dengan Galeri/Struktur. Excerpt sudah ada di payload list
               (beda dari Galeri yang perlu fetch deskripsi on-demand), jadi
               sheet-nya langsung tampil penuh tanpa loading state. ---------- -->
          <div class="news-mobile-carousel">
            <div class="gm-track-wrap">
              <div class="gm-track" #mobileTrack (scroll)="onMobileScroll()">
                @for (item of repo.publicNews(); track item.newsID; let i = $index) {
                  <div class="gm-slide stagger-in" [style.--stagger-i]="i">
                    <button type="button" class="news-mobile-card" (click)="openSheet(item)">
                      <div class="news-card-media">
                        @if (item.newsImage) {
                          <img [src]="thumbUrl(item.newsImage)" [alt]="item.newsTitle" loading="lazy" />
                        } @else {
                          <div class="news-card-media-fallback"><app-icon name="newspaper" [size]="26" /></div>
                        }
                        @if (item.isFeatured) {
                          <span class="news-card-featured"><app-icon name="star" [size]="10" /> Unggulan</span>
                        }
                      </div>
                      <div class="news-card-body">
                        <span class="news-card-cat">{{ item.categoryName }}</span>
                        <h3 class="news-card-title">{{ item.newsTitle }}</h3>
                        <span class="news-mobile-hint"><app-icon name="eye" [size]="11" /> Ketuk untuk pratinjau</span>
                      </div>
                    </button>
                  </div>
                }
              </div>
            </div>

            @if (repo.publicNews().length > 1) {
              <div class="gm-dots">
                @for (i of dotIndices(); track i) {
                  <button type="button" class="gm-dot" [class.active]="activeSlide() === i" [class.edge]="isEdgeDot(i)" (click)="scrollToSlide(i)" [attr.aria-label]="'Slide ' + (i + 1)"></button>
                }
              </div>
            }
          </div>

          @if (repo.publicTotal() > limit) {
            <div class="pagination-wrapper">
              <app-pagination
                [page]="repo.publicPage()"
                [count]="repo.publicTotal()"
                [limit]="limit"
                itemLabel="berita"
                (pageChange)="onPageChange($event)"
              />
            </div>
          }
        }
      </div>
    </section>

    <!-- ---------- Bottom sheet mobile: preview berita ----------
         Data dasar + excerpt sudah ada dari list (berbeda dari Galeri yang
         fetch deskripsi on-demand) — sheet langsung tampil tanpa skeleton. ---------- -->
    <app-bottom-sheet
      [open]="sheetItem() !== null"
      (closed)="closeSheet()"
      ctaLabel="Baca Selengkapnya"
      (ctaClick)="goToSheetDetail()"
    >
      @if (sheetItem(); as item) {
        <div class="sheet-image">
          @if (item.newsImage) {
            <img [src]="thumbUrl(item.newsImage)" [alt]="item.newsTitle">
          } @else {
            <div class="news-card-media-fallback sheet-image-fallback"><app-icon name="newspaper" [size]="30" /></div>
          }
          @if (item.isFeatured) {
            <span class="news-card-featured"><app-icon name="star" [size]="11" /> Unggulan</span>
          }
        </div>
        <span class="chip chip-green">{{ item.categoryName }}</span>
        <h3 class="sheet-title">{{ item.newsTitle }}</h3>
        <div class="sheet-meta-rows">
          <div class="sheet-meta-row">
            <span class="sheet-meta-icon"><app-icon name="user-circle" [size]="13" /></span>
            <span>
              <span class="sheet-meta-label">Penulis</span>
              <span class="sheet-meta-value">{{ item.newsReporter || item.authorName }}</span>
            </span>
          </div>
          @if (item.publishedDate) {
            <div class="sheet-meta-row">
              <span class="sheet-meta-icon"><app-icon name="calendar-days" [size]="13" /></span>
              <span>
                <span class="sheet-meta-label">Dipublikasikan</span>
                <span class="sheet-meta-value">{{ item.publishedDate | date: 'd MMMM y' }}</span>
              </span>
            </div>
          }
        </div>
        <p class="sheet-excerpt">{{ item.newsExcerpt }}</p>
      }
    </app-bottom-sheet>
  `,
  styles: [`
    /* ---------- Siluet hero: koran terlipat + jaringan "digambar sendiri" —
       style proyeksi [heroVisual] milik pemanggil (lihat komentar di
       template). Koran "tumbuh" dulu (scale+fade dari bawah, sama seperti
       .tree-silhouette/.msg-envelope-silhouette), lalu jaringan menyusul. ---------- */
    .hero-news-paper { position: relative; width: 100%; }
    .news-svg { position: relative; z-index: 1; width: 100%; height: 240px; overflow: visible; }

    .news-paper-silhouette {
      transform-box: fill-box; transform-origin: 50% 100%; opacity: 0;
      animation: newspaperGrow .9s cubic-bezier(.34,1.4,.64,1) forwards;
      filter: drop-shadow(0 10px 18px rgba(0,147,59,.2));
    }
    @keyframes newspaperGrow { from { opacity: 0; transform: scale(.75) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .news-ground-shadow { fill: var(--color-primary-dark); opacity: .14; }
    @media (prefers-reduced-motion: reduce) { .news-paper-silhouette { animation: none; opacity: 1; transform: none; } }

    .news-line { fill: none; stroke: var(--color-primary); stroke-width: 1.8; stroke-linecap: round; opacity: .55; }
    .news-line.thick { stroke-width: 2.6; opacity: .75; stroke: var(--color-primary-bright); }
    .news-tier { opacity: 0; animation: newsTierFadeIn .4s ease-out forwards; }
    .news-tier-0 { animation-delay: .75s; }
    .news-tier-1 { animation-delay: 1.3s; }
    .news-tier-2 { animation-delay: 1.8s; }
    @keyframes newsTierFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .news-badge {
      transform-box: fill-box; transform-origin: center; opacity: 0;
      animation: newsBadgePop .5s cubic-bezier(.34,1.4,.64,1) 2.2s forwards;
    }
    @keyframes newsBadgePop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: scale(1); } }
    @media (prefers-reduced-motion: reduce) { .news-tier, .news-badge { animation: none; opacity: 1; transform: none; } }

    /* ---------- Section hijau PENUH tepi-ke-tepi (bukan lagi panel bulat
       mengambang) — pola sama seperti .agenda-panel (section "Event
       Terbaru" Beranda), tapi di sini mewarnai SELURUH section: judul,
       toolbar, daftar berita, pagination, semuanya. Dua siluet ikon koran
       raksasa pudar nempel ke section itu sendiri (pojok berlawanan),
       bukan gambar/SVG custom — cuma app-icon ukuran besar + opacity
       rendah, sama seperti teknik .agenda-panel-silhouette. ---------- */
    .section {
      position: relative; overflow: hidden;
      background: var(--color-primary);
      min-height: 60vh; padding: 56px 0 72px;
    }
    .news-panel-silhouette {
      position: absolute; right: -40px; bottom: -40px; z-index: 0; color: rgba(255,255,255,.12);
      transform: rotate(-12deg); pointer-events: none;
    }
    .news-panel-silhouette-2 {
      position: absolute; left: -24px; top: -24px; z-index: 0; color: rgba(255,255,255,.08);
      transform: rotate(16deg); pointer-events: none;
    }
    .section > .container { position: relative; z-index: 1; }

    /* Elemen transisi hero -> section (sibling, BUKAN child .section) —
       MENIMPA wave bawaan .hero-wave (warnanya tint/pucat, itu sebabnya
       masih terlihat ada warna ketiga nongol di tengah) dengan wave hijau
       bentuk identik di posisi PERSIS sama: margin-top negatif setinggi
       .hero-wave (80px, lihat shared/page-hero.component.ts) + z-index di
       atas .hero (z-index:5 di sana) supaya elemen ini digambar DI ATASNYA,
       menutup penuh wave pucat itu. Hasilnya cuma satu wave hijau yang
       kelihatan, langsung menyatu ke .section — tanpa jarak/warna pucat
       tersisa di antaranya. Tinggi & margin SAMA (saling meniadakan) jadi
       tidak menambah tinggi halaman. */
    .hero-to-section-transition {
      position: relative; z-index: 6;
      height: 80px; margin-top: -80px; line-height: 0; pointer-events: none;
    }
    .hero-to-section-transition svg { display: block; width: 100%; height: 100%; }
    .hero-to-section-transition path { fill: var(--color-primary); }

    .news-section-head { margin-bottom: 28px; }
    .news-section-head h2 { margin: 14px 0 10px; color: #fff; }
    .news-section-subtitle { max-width: 560px; margin: 0 auto; color: rgba(255,255,255,.85); font-size: 1.02rem; line-height: 1.6; }

    /* Slab putih — state error/kosong butuh teks gelap tetap terbaca di atas
       hijau (lihat komentar di template), bukan diwarnai ulang satu-satu. */
    .news-panel-slab { background: #fff; border-radius: var(--radius-md); }

    .news-toolbar { max-width: 900px; margin: 0 auto 32px; }
    /* Tombol "Filter" bawaan app-search-filter-sort solid hijau (cocok di
       atas latar terang) — di atas section hijau ini jadi nyaris melebur
       dengan background-nya sendiri. Dibalik jadi putih (pola sama seperti
       tombol "Urutkan" yang sudah putih) supaya tetap kontras; override di
       sini (BUKAN di komponen globalnya) karena di halaman lain yang masih
       berlatar terang warna solid hijau aslinya tetap benar. */
    ::ng-deep .news-toolbar .sfs-btn-filter { background: #fff; color: var(--color-primary-dark); }
    ::ng-deep .news-toolbar .sfs-btn-filter:hover { background: var(--color-primary-soft); }
    ::ng-deep .news-toolbar .sfs-count { box-shadow: 0 0 0 2px var(--color-primary); }

    @media (max-width: 640px) {
      .section { padding: 40px 0 56px; }
    }

    /* ---------- Animasi state "tidak ada data" — identik pola Galeri. ---------- */
    .news-empty-anim { animation: newsEmptyFadeIn .5s var(--ease-out) both; }
    @keyframes newsEmptyFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
    .news-empty-icon {
      position: relative;
      animation: newsEmptyIconPop .5s var(--ease-out) .1s both, newsEmptyIconFloat 3.2s ease-in-out .6s infinite;
    }
    @keyframes newsEmptyIconPop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: scale(1); } }
    @keyframes newsEmptyIconFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    .news-empty-icon-badge {
      display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px;
      border-radius: 50%; margin: 0 auto 14px; color: #fff;
      background: linear-gradient(150deg, var(--color-primary-bright), var(--color-primary));
      box-shadow: 0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent);
    }
    .news-empty-title, .news-empty-desc { animation: newsEmptyFadeIn .5s var(--ease-out) both; }
    .news-empty-title { animation-delay: .18s; }
    .news-empty-desc { animation-delay: .28s; }
    .news-empty-suggestions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 6px; animation: newsEmptyFadeIn .5s var(--ease-out) .4s both; }
    .news-empty-suggestions .chip {
      display: inline-flex; align-items: center; gap: 6px;
      transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease,
        background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .news-empty-suggestions .chip:hover {
      transform: translateY(-3px); box-shadow: var(--shadow-sm);
      background: var(--color-primary-soft); color: var(--color-primary-dark);
    }
    @media (prefers-reduced-motion: reduce) {
      .news-empty-anim, .news-empty-icon, .news-empty-title, .news-empty-desc, .news-empty-suggestions {
        animation: none; opacity: 1; transform: none;
      }
    }

    /* ---------- Skeleton loading — bentuk kartu editorial asli. ---------- */
    .news-card-skel { border-radius: 20px; overflow: hidden; background: #fff; border: 1px solid var(--color-border); }
    .news-card-skel-body { padding: 24px 22px; display: flex; flex-direction: column; gap: 10px; }
    .gm-slide-skel { width: 100%; aspect-ratio: 4 / 3; border-radius: 20px; }

    /* ---------- Desktop: grid kartu editorial ----------
       Badan putih + ribbon kategori mengambang (separuh di foto, separuh di
       body) — trik editorial yang menyatukan dua area tanpa garis batas
       tegas. Hover = lift + garis aksen atas yang "tumbuh" dari kiri, foto
       zoom halus — BUKAN scrim gelap + teks mengambang seperti Galeri. ---------- */
    .news-desktop-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .news-card { border-radius: 20px; }
    /* Garis aksen hover MELINGKARI seluruh kartu (bukan cuma strip atas) —
       pakai box-shadow sebagai "ring", bukan border-width (animasi
       border-width memicu layout thrash; box-shadow tidak). Ring mengikuti
       border-radius kartu secara alami karena box-shadow selalu menjiplak
       bentuk box, beda dari outline yang tidak konsisten membulat di semua
       browser. */
    .news-card-link {
      position: relative;
      display: flex; flex-direction: column; height: 100%;
      background: #fff; border-radius: 20px; overflow: hidden;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm), 0 0 0 0 var(--color-primary-bright);
      text-decoration: none; color: inherit;
      transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s cubic-bezier(.22,1,.36,1), border-color .35s ease;
    }

    .news-card-media { position: relative; aspect-ratio: 16 / 10; overflow: hidden; background: var(--color-bg-alt); }
    .news-card-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .6s cubic-bezier(.22,1,.36,1); }
    .news-card-media-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-primary); background: var(--color-primary-soft); }

    .news-card-featured {
      position: absolute; top: 12px; right: 12px; z-index: 2;
      display: inline-flex; align-items: center; gap: 5px;
      background: linear-gradient(135deg, var(--color-gold), var(--color-gold-dark));
      color: #fff; font-size: .7rem; font-weight: 800; letter-spacing: .02em;
      padding: 5px 10px; border-radius: var(--radius-full);
      box-shadow: 0 4px 12px rgba(0,0,0,.2);
    }

    .news-card-body { position: relative; flex: 1; display: flex; flex-direction: column; padding: 22px; }

    /* Pill kategori normal di alur (BUKAN absolute mengambang di jahitan
       foto/body lagi) — ditempatkan di bawah gambar, sebelum judul. */
    .news-card-cat {
      display: inline-flex; align-items: center; align-self: flex-start;
      background: linear-gradient(135deg, var(--color-primary-bright), var(--color-primary));
      color: #fff; font-size: .72rem; font-weight: 700; letter-spacing: .02em;
      padding: 6px 14px; border-radius: var(--radius-full);
      box-shadow: 0 6px 14px color-mix(in srgb, var(--color-primary) 35%, transparent);
    }

    .news-card-title {
      margin: 14px 0 8px; font-size: 1.08rem; font-weight: 800; font-family: var(--font-heading);
      line-height: 1.38; color: var(--color-text);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .news-card-excerpt {
      margin: 0 0 16px; font-size: .88rem; line-height: 1.6; color: var(--color-text-secondary); flex: 1;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .news-card-meta { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; }
    .news-card-meta-item { display: inline-flex; align-items: center; gap: 5px; font-size: .74rem; color: var(--color-muted); font-weight: 600; }

    .news-card-cta {
      display: inline-flex; align-items: center; gap: 5px; margin-top: auto;
      font-size: .82rem; font-weight: 700; color: var(--color-primary);
      transition: gap .25s ease, color .25s ease;
    }

    @media (hover: hover) and (pointer: fine) {
      .news-card-link:hover {
        transform: translateY(-8px);
        box-shadow: 0 24px 48px rgba(0,60,25,.14), 0 0 0 2px var(--color-primary-bright);
        border-color: transparent;
      }
      .news-card-link:hover .news-card-media img { transform: scale(1.08); }
      .news-card-link:hover .news-card-cta { gap: 9px; color: var(--color-primary-dark); }
    }

    /* ---------- Mobile: carousel scroll-snap + dots (disembunyikan di
       >=901px) — mekanisme geser sama persis dengan Galeri/Struktur, kartu
       editorial-nya sendiri beda gaya. ---------- */
    .news-mobile-carousel { display: none; }
    .gm-track-wrap { margin: 0 -20px; padding: 0 24px; }
    .gm-track {
      display: flex; overflow-x: auto; gap: 16px; padding: 4px 0 16px;
      scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none;
    }
    .gm-track::-webkit-scrollbar { display: none; }
    .gm-slide { flex: 0 0 78%; scroll-snap-align: start; display: flex; }

    .news-mobile-card {
      position: relative; width: 100%; display: flex; flex-direction: column;
      border: none; padding: 0; background: #fff; cursor: pointer; text-align: left;
      border-radius: 20px; overflow: hidden; box-shadow: var(--shadow);
      -webkit-tap-highlight-color: transparent;
    }
    .news-mobile-card .news-card-media { aspect-ratio: 16 / 10; }
    .news-mobile-card .news-card-body { padding: 18px; }
    .news-mobile-card .news-card-title { margin-bottom: 10px; }
    .news-mobile-hint {
      display: inline-flex; align-items: center; gap: 5px; width: fit-content;
      font-size: .7rem; font-weight: 700; color: var(--color-primary-dark);
      background: var(--color-primary-soft); padding: 4px 10px; border-radius: var(--radius-full);
    }

    .gm-dots { display: flex; justify-content: center; gap: 8px; margin-top: 4px; }
    .gm-dot { width: 8px; height: 8px; border-radius: var(--radius-full); border: none; background: var(--color-border-strong); padding: 0; cursor: pointer; transition: width .25s ease, background .25s ease, transform .25s ease, opacity .25s ease; }
    .gm-dot.active { width: 22px; background: var(--color-primary); }
    .gm-dot.edge:not(.active) { transform: scale(.5); opacity: .5; }

    @media (max-width: 900px) {
      .news-desktop-grid { display: none; }
      .news-mobile-carousel { display: block; }
    }
    @media (max-width: 992px) and (min-width: 901px) {
      .news-desktop-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
    }

    /* ---------- Sheet preview: foto + badge + meta + ringkasan ----------
       Pola sama dengan Galeri (sheet-image/sheet-title/sheet-meta-row/
       sheet-excerpt) — didefinisikan ulang di sini karena view encapsulation
       Angular tidak membagikan style antar komponen. ---------- */
    .sheet-image { position: relative; margin: 0 0 14px; border-radius: 14px; overflow: hidden; }
    .sheet-image img { display: block; width: 100%; height: 220px; object-fit: cover; object-position: center top; }
    .sheet-image-fallback { position: relative; height: 220px; }
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

    .pagination-wrapper {
      margin-top: 48px;
      display: flex;
      justify-content: center;
    }
    /* Teks "Menampilkan X-Y dari Z berita" bawaan app-pagination berwarna
       abu-abu muted + hijau tua (dirancang untuk latar terang) — nyaris tak
       terbaca di atas section hijau ini. Kartu nomor halaman (.pgn-card)
       sendiri sudah putih jadi tetap kontras, tidak disentuh. */
    ::ng-deep .pagination-wrapper .pgn-info { color: rgba(255,255,255,.8) !important; }
    ::ng-deep .pagination-wrapper .pgn-info strong { color: #fff !important; }
  `],
})
export class NewsPublicIndexPage implements OnInit, AfterViewInit {
  repo = inject(NewsRepository);
  private router = inject(Router);

  limit = 9;
  currentSort = signal('-publishedDate');
  searchText = signal('');
  /** Nilai filter aktif — key cocok dengan FilterFieldDef.key (lihat
   *  filterFields()): cuma 'category' (Berita cuma punya satu kategori per
   *  item, beda dari Galeri yang punya Tahun+Nama Kegiatan). */
  filterValues = signal<Record<string, unknown>>({});

  readonly sortOptions: SortOptionDef[] = [
    { value: '-publishedDate', label: 'Terbaru', icon: 'clock' },
    { value: 'newsTitle', label: 'Judul A-Z', icon: 'chevrons-up-down' },
    { value: '-viewCount', label: 'Terpopuler', icon: 'eye' },
  ];

  /** Field filter Berita — Kategori (single, selalu ada begitu kategori
   *  termuat) ditambah Tahun Terbit/Penulis (multi-select, data-driven dari
   *  repo.filterOptions() supaya dropdown tidak pernah menawarkan pilihan
   *  yang hasilnya kosong — pola sama seperti Galeri) dan Unggulan
   *  (single, statis Ya/Tidak). Field tambahan baru tampil setelah
   *  filterOptions() termuat, supaya tidak "berkedip" muncul belakangan. */
  filterFields = computed<FilterFieldDef[]>(() => {
    const cats = this.repo.publicCategories();
    if (!cats.length) return [];
    const fields: FilterFieldDef[] = [
      {
        key: 'category',
        label: 'Kategori',
        icon: 'tags',
        options: cats.map((c) => ({ value: c.categorySlug, label: c.categoryName })),
      },
    ];

    const opts = this.repo.filterOptions();
    if (opts) {
      fields.push(
        {
          key: 'year',
          label: 'Tahun Terbit',
          icon: 'calendar-days',
          multiple: true,
          options: opts.years.map((y) => ({ value: y, label: String(y) })),
        },
        {
          key: 'reporter',
          label: 'Penulis',
          icon: 'user-circle',
          multiple: true,
          options: opts.reporters.map((r) => ({ value: r, label: r })),
        },
      );
    }

    fields.push({
      key: 'featured',
      label: 'Unggulan',
      icon: 'star',
      options: [
        { value: 'true', label: 'Ya' },
        { value: 'false', label: 'Tidak' },
      ],
    });

    return fields;
  });

  readonly skeletonItems = Array.from({ length: 6 }, (_, i) => i);

  sheetItem = signal<News | null>(null);

  activeSlide = signal(0);
  @ViewChild('mobileTrack') private mobileTrackRef?: ElementRef<HTMLElement>;
  @ViewChild('sectionHead') private sectionHeadRef?: ElementRef<HTMLElement>;
  @ViewChildren('newsLine') private newsLineRefs!: QueryList<ElementRef<SVGPathElement>>;

  dotIndices = computed(() => {
    const total = this.repo.publicNews().length;
    if (total <= MAX_MOBILE_DOTS) return Array.from({ length: total }, (_, i) => i);
    const half = Math.floor(MAX_MOBILE_DOTS / 2);
    const start = Math.max(0, Math.min(this.activeSlide() - half, total - MAX_MOBILE_DOTS));
    return Array.from({ length: MAX_MOBILE_DOTS }, (_, i) => start + i);
  });

  ngOnInit(): void {
    this.loadData();
    this.repo.loadPublicCategories();
    this.repo.loadFilterOptions();
  }

  ngAfterViewInit(): void {
    this.animateNewsLines();
  }

  loadData(page = this.repo.publicPage()): void {
    const filter = this.filterValues();
    const featured = filter['featured'] as string | undefined;
    this.repo.loadPublic(page, this.limit, this.currentSort(), {
      search: this.searchText(),
      category: filter['category'] as string | undefined,
      year: filter['year'] as number[] | undefined,
      reporter: filter['reporter'] as string[] | undefined,
      featured: featured === undefined ? undefined : featured === 'true',
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
    const total = this.repo.publicNews().length;
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

  openSheet(item: News): void {
    this.sheetItem.set(item);
  }

  closeSheet(): void {
    this.sheetItem.set(null);
  }

  goToSheetDetail(): void {
    const item = this.sheetItem();
    if (!item) return;
    this.router.navigate(['/berita', item.newsSlug]);
  }

  /** Efek "jaringan digambar sendiri" — identik animateMsgLines() di Kontak/
   *  animateOrgLines() di Struktur: stroke di-dash sepanjang total panjang
   *  path (getTotalLength()) lalu dashoffset dianimasikan lewat Web
   *  Animations API, digilir per-garis. Menghormati prefers-reduced-motion. */
  private animateNewsLines(): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.newsLineRefs?.forEach((ref, i) => {
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

  imgUrl = resolveImageUrl;
  thumbUrl = resolveThumbnailUrl;
}
