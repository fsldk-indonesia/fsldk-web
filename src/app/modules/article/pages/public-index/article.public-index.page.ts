import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ArticleRepository } from '../../repositories/article.repository';
import { Article } from '../../entities/article';
import { ArticleCategory } from '../../entities/article-category';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { BottomSheetComponent } from '../../../../shared/bottom-sheet.component';
import { SearchFilterSortComponent, FilterFieldDef, SortOptionDef } from '../../../../shared/search-filter-sort.component';
import { resolveImageUrl, resolveThumbnailUrl } from '../../../../core/utils/image-url';

/** Maksimum titik indikator carousel mobile yang tampak sekaligus — sisanya
 *  digulung lewat window geser (dot tepi mengecil), pola sama seperti
 *  Galeri/Struktur Organisasi (lihat gallery.public-index.page.ts). */
const MAX_MOBILE_DOTS = 7;

/** Teks polos dari articleIntro (rich HTML) untuk excerpt kartu — HANYA
 *  dipakai sebagai teks biasa (bukan di-render via innerHTML), jadi aman
 *  tanpa DomSanitizer. Dipotong ke maxLen karakter + elipsis. */
function plainExcerpt(html: string | null | undefined, maxLen = 150): string {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '…';
}

/** Estimasi waktu baca (menit) dari jumlah kata articleIntro, ~200 kata/menit. */
function readingMinutes(html: string | null | undefined): number {
  if (!html) return 1;
  const words = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Public landing page for browsing articles. Hero publik reusable
 * (shared/page-hero.component.ts) — bahasa visual sama dengan Galeri/
 * Struktur Organisasi/Kontak. Kartu desktop sengaja BUKAN gaya "foto
 * full-bleed + scrim" seperti Galeri — artikel adalah konten tekstual, jadi
 * kartunya gaya editorial/majalah: gambar di kepala kartu, badan putih di
 * bawahnya dengan judul/excerpt/meta, pita kategori mengambang di jahitan
 * gambar->badan.
 */
@Component({
  selector: 'app-article-public-index',
  standalone: true,
  imports: [RouterLink, DatePipe, IconComponent, PaginationComponent, PageHeroComponent, BottomSheetComponent, SearchFilterSortComponent],
  template: `
    <app-page-hero
      badge="Artikel &amp; Kajian · FSLDK Indonesia"
      title="Gagasan &amp; Wawasan"
      titleAccent="Dakwah Kampus Kita"
      subtitle="Kumpulan artikel, opini, dan kajian dari jaringan LDK se-Indonesia — merangkai ilmu menjadi gerak dakwah kampus yang berkelanjutan."
      quoteSource="quran">
      <!-- Siluet sisi kanan hero: buku terbuka + bulu angsa (pola sama seperti
           kamera Galeri/amplop Kontak) — pita baris teks di tiap halaman
           melambangkan tulisan, bulu angsa "menulis" di atasnya, simpul
           berdenyut (.network-node/.network-ping global, styles.scss)
           melambangkan gagasan yang menyebar. -->
      <div heroVisual class="hero-article-book">
        <svg aria-hidden="true" viewBox="0 0 560 320" class="article-book-svg">
          <defs>
            <linearGradient id="articlePageFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ffffff" stop-opacity=".97" />
              <stop offset="100%" stop-color="var(--color-primary-soft)" stop-opacity=".92" />
            </linearGradient>
            <linearGradient id="articleSpineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--color-primary-bright)" />
              <stop offset="100%" stop-color="var(--color-primary-dark)" />
            </linearGradient>
            <filter id="articleSoftBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>

          <g class="article-book-group">
            <ellipse class="article-book-shadow" cx="280" cy="248" rx="150" ry="11" filter="url(#articleSoftBlur)" />

            <path class="article-page" d="M280,118 L140,94 Q130,92 130,104 L130,222 Q130,232 140,234 L280,252 Z" />
            <path class="article-page" d="M280,118 L420,94 Q430,92 430,104 L430,222 Q430,232 420,234 L280,252 Z" />
            <rect class="article-spine" x="276" y="108" width="8" height="136" rx="3" />

            <rect class="article-line" x="150" y="128" width="98" height="5" rx="2.5" style="animation-delay:.45s" />
            <rect class="article-line" x="150" y="146" width="84" height="5" rx="2.5" style="animation-delay:.52s" />
            <rect class="article-line" x="150" y="164" width="92" height="5" rx="2.5" style="animation-delay:.59s" />
            <rect class="article-line" x="150" y="182" width="68" height="5" rx="2.5" style="animation-delay:.66s" />

            <rect class="article-line" x="314" y="128" width="98" height="5" rx="2.5" style="animation-delay:.48s" />
            <rect class="article-line" x="314" y="146" width="90" height="5" rx="2.5" style="animation-delay:.55s" />
            <rect class="article-line" x="314" y="164" width="78" height="5" rx="2.5" style="animation-delay:.62s" />

            <g class="article-quill" transform="rotate(38 368 150)">
              <rect x="363" y="58" width="9" height="104" rx="4.5" fill="var(--color-gold-dark)" />
              <path d="M367.5,58 Q352,38 367.5,18 Q383,38 367.5,58 Z" fill="var(--color-gold)" />
            </g>
          </g>

          <g class="article-tier">
            <circle class="network-ping gold" cx="140" cy="88" r="8" />
            <circle class="network-node gold" cx="140" cy="88" r="8" />
            <circle class="network-ping" cx="430" cy="88" r="7" style="animation-delay:.3s" />
            <circle class="network-node" cx="430" cy="88" r="7" />
          </g>
        </svg>
      </div>
    </app-page-hero>

    <section class="section section-transition section-blob-drift">
      <div class="container pb-xl">
        <div class="article-section-head text-center reveal" #sectionHead>
          <h2>Pustaka Opini &amp; Kajian Dakwah</h2>
          <p class="article-section-subtitle">Telusuri gagasan, analisis, dan refleksi dakwah kampus yang ditulis langsung oleh kader dan pengurus LDK se-Indonesia.</p>
        </div>

        <div class="article-toolbar">
          <app-search-filter-sort
            searchPlaceholder="Cari judul artikel atau nama penulis..."
            [searchValue]="searchText()"
            [filterFields]="filterFields()"
            [filterValues]="filterValues()"
            [sortOptions]="sortOptions"
            [sortValue]="currentSort()"
            filterTitle="Filter Artikel"
            filterSubtitle="Pilih kategori dan tahun publikasi untuk menyaring artikel."
            [filterMobileSheet]="true"
            (searchChange)="onSearchChange($event)"
            (filterApply)="onFilterApply($event)"
            (sortChange)="onSortChange($event)"
          />
        </div>

        @if (repo.loading()) {
          <div class="article-desktop-grid" aria-hidden="true">
            @for (i of skeletonItems; track i) {
              <div class="article-card-skel">
                <span class="skel article-card-skel-media"></span>
                <div class="article-card-skel-body">
                  <span class="skel skel-line" style="width:60%;height:12px"></span>
                  <span class="skel skel-line" style="width:90%;height:18px;margin-top:10px"></span>
                  <span class="skel skel-line" style="width:70%;height:18px"></span>
                  <span class="skel skel-line" style="width:100%;margin-top:10px"></span>
                  <span class="skel skel-line" style="width:85%"></span>
                </div>
              </div>
            }
          </div>
          <div class="article-mobile-carousel" aria-hidden="true">
            <div class="am-track-wrap">
              <div class="am-track">
                @for (i of skeletonItems; track i) {
                  <div class="am-slide"><div class="am-slide-skel skel"></div></div>
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
        } @else if (repo.publicArticles().length === 0 && hasActiveSearchOrFilter()) {
          <div class="empty-state article-empty-anim">
            <span class="article-empty-icon article-empty-icon-badge">
              <app-icon name="search" [size]="26" />
            </span>
            <h3 class="article-empty-title">Artikel Tidak Ditemukan</h3>
            <p class="article-empty-desc">Coba ubah kata kunci atau hapus beberapa filter yang aktif.</p>
            <div class="article-empty-suggestions">
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
        } @else if (repo.publicArticles().length === 0) {
          <div class="empty-state article-empty-anim">
            <div class="empty-icon article-empty-icon"><app-icon name="book-open" [size]="48" /></div>
            <h3 class="article-empty-title">Belum Ada Artikel</h3>
            <p class="article-empty-desc">Artikel dan kajian akan muncul di sini setelah dipublikasikan.</p>
          </div>
        } @else {
          <!-- ---------- Desktop: grid kartu editorial (>=901px) — gambar di
               kepala kartu, pita kategori mengambang di jahitan gambar->badan,
               badan putih berisi judul/excerpt/meta. BERBEDA sengaja dari
               kartu Galeri (foto full-bleed + scrim) karena ini konten
               tekstual, bukan visual. ---------- -->
          <div class="article-desktop-grid">
            @for (a of repo.publicArticles(); track a.articleID; let i = $index) {
              <article class="article-card stagger-in" [style.--stagger-i]="i">
                <a [routerLink]="['/artikel', a.articleSlug]" class="article-card-link">
                  <div class="article-card-media">
                    @if (a.articleImage) {
                      <img [src]="thumbUrl(a.articleImage)" [alt]="a.articleTitle" loading="lazy" />
                    } @else {
                      <div class="article-card-media-fallback"><app-icon name="book-open" [size]="30" /></div>
                    }
                    @if (a.articlePdf) {
                      <span class="article-card-pdf-flag"><app-icon name="file-text" [size]="11" /> PDF</span>
                    }
                  </div>
                  <div class="article-card-body">
                    <span class="article-card-category"><app-icon name="tags" [size]="11" /> {{ a.categoryName }}</span>
                    <div class="article-card-meta-top">
                      <span><app-icon name="calendar-days" [size]="12" /> {{ a.publishedDate | date: 'd MMM yyyy' }}</span>
                      <span><app-icon name="clock" [size]="12" /> {{ readingTime(a.articleIntro) }} menit baca</span>
                    </div>
                    <h3 class="article-card-title">{{ a.articleTitle }}</h3>
                    <p class="article-card-excerpt">{{ excerpt(a.articleIntro) }}</p>
                    <div class="article-card-footer">
                      <span class="article-card-writer"><app-icon name="user-circle" [size]="13" /> {{ a.articleWriter || a.authorName }}</span>
                      <span class="article-card-cta">Baca <app-icon name="chevron-right" [size]="12" /></span>
                    </div>
                  </div>
                </a>
              </article>
            } @empty {
              <div class="empty-state" style="grid-column:1/-1">
                <div class="empty-icon"><app-icon name="book-open" [size]="48" /></div>
                <h3>Belum Ada Artikel</h3>
              </div>
            }
          </div>

          <!-- ---------- Mobile: carousel scroll-snap + dot indicator, tap
               kartu membuka bottom sheet berisi preview lengkap (bukan
               langsung pindah halaman) — pola sama dengan Galeri. Tidak
               perlu fetch terpisah: payload listing sudah memuat articleIntro
               utuh (lihat article_repository_impl.go selectCols), jadi
               openSheet() cukup set signal langsung tanpa loading state. ---------- -->
          <div class="article-mobile-carousel">
            <div class="am-track-wrap">
              <div class="am-track" #mobileTrack (scroll)="onMobileScroll()">
                @for (a of repo.publicArticles(); track a.articleID; let i = $index) {
                  <div class="am-slide stagger-in" [style.--stagger-i]="i">
                    <button type="button" class="am-slide-card" (click)="openSheet(a)">
                      <div class="am-slide-media">
                        @if (a.articleImage) {
                          <img [src]="thumbUrl(a.articleImage)" [alt]="a.articleTitle" loading="lazy" />
                        } @else {
                          <div class="article-card-media-fallback"><app-icon name="book-open" [size]="26" /></div>
                        }
                      </div>
                      <div class="am-slide-body">
                        <span class="article-card-category"><app-icon name="tags" [size]="11" /> {{ a.categoryName }}</span>
                        <h3 class="am-slide-title">{{ a.articleTitle }}</h3>
                        <p class="am-slide-excerpt">{{ excerpt(a.articleIntro, 90) }}</p>
                        <span class="am-slide-hint"><app-icon name="eye" [size]="12" /> Ketuk untuk pratinjau</span>
                      </div>
                    </button>
                  </div>
                }
              </div>
            </div>

            @if (repo.publicArticles().length > 1) {
              <div class="am-dots">
                @for (i of dotIndices(); track i) {
                  <button type="button" class="am-dot" [class.active]="activeSlide() === i" [class.edge]="isEdgeDot(i)" (click)="scrollToSlide(i)" [attr.aria-label]="'Slide ' + (i + 1)"></button>
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
                itemLabel="artikel"
                (pageChange)="onPageChange($event)"
              />
            </div>
          }
        }
      </div>
    </section>

    <!-- ---------- Bottom sheet mobile: preview artikel ----------
         Gambar + kategori + judul + meta (penulis/editor/tanggal) + excerpt
         ringkas, CTA footer pindah ke halaman detail lengkap (tempat
         articleIntro utuh di-render sebagai HTML + bagian komentar). ---------- -->
    <app-bottom-sheet
      [open]="sheetItem() !== null"
      (closed)="closeSheet()"
      ctaLabel="Baca Artikel Lengkap"
      (ctaClick)="goToSheetDetail()"
    >
      @if (sheetItem(); as item) {
        <div class="sheet-image">
          @if (item.articleImage) {
            <img [src]="imgUrl(item.articleImage)" [alt]="item.articleTitle">
          } @else {
            <div class="sheet-image-fallback"><app-icon name="book-open" [size]="34" /></div>
          }
          @if (item.articlePdf) {
            <span class="sheet-image-badge"><app-icon name="file-text" [size]="12" /> PDF Tersedia</span>
          }
        </div>
        <span class="chip chip-green">{{ item.categoryName }}</span>
        <h3 class="sheet-title">{{ item.articleTitle }}</h3>
        <div class="sheet-meta-rows">
          <div class="sheet-meta-row">
            <span class="sheet-meta-icon"><app-icon name="user-circle" [size]="13" /></span>
            <span>
              <span class="sheet-meta-label">Penulis</span>
              <span class="sheet-meta-value">{{ item.articleWriter || item.authorName }}</span>
            </span>
          </div>
          @if (item.publishedDate) {
            <div class="sheet-meta-row">
              <span class="sheet-meta-icon"><app-icon name="calendar-days" [size]="13" /></span>
              <span>
                <span class="sheet-meta-label">Tanggal Publikasi</span>
                <span class="sheet-meta-value">{{ item.publishedDate | date: 'd MMMM y' }}</span>
              </span>
            </div>
          }
        </div>
        <p class="sheet-excerpt">{{ excerpt(item.articleIntro, 260) }}</p>
      }
    </app-bottom-sheet>
  `,
  styles: [`
    /* ---------- Siluet hero: buku terbuka + bulu angsa — style proyeksi
       [heroVisual] milik pemanggil (lihat komentar di template). Buku
       "tumbuh" dulu (scale+fade dari bawah, sama seperti kamera Galeri),
       baris teks fade-in menyusul dengan stagger, bulu angsa jatuh menulis,
       lalu simpul sudut (.article-tier) muncul terakhir. ---------- */
    .hero-article-book { position: relative; width: 100%; }
    .article-book-svg { position: relative; z-index: 1; width: 100%; height: 240px; overflow: visible; }

    .article-book-group {
      transform-box: fill-box; transform-origin: 50% 100%; opacity: 0;
      animation: articleBookGrow .9s cubic-bezier(.34,1.4,.64,1) forwards;
      filter: drop-shadow(0 10px 18px rgba(0,147,59,.18));
    }
    @keyframes articleBookGrow { from { opacity: 0; transform: scale(.75) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

    .article-book-shadow { fill: var(--color-primary-dark); opacity: .14; }
    .article-page { fill: url(#articlePageFill); stroke: var(--color-border); }
    .article-spine { fill: url(#articleSpineFill); }
    .article-line { fill: var(--color-primary); opacity: .22; animation: articleLineFadeIn .4s ease-out forwards; opacity: 0; }
    @keyframes articleLineFadeIn { from { opacity: 0; } to { opacity: .28; } }

    .article-quill { transform-box: fill-box; transform-origin: 50% 100%; opacity: 0; animation: articleQuillDrop .5s var(--ease-out) .62s forwards; }
    @keyframes articleQuillDrop { from { opacity: 0; transform: translateY(-14px) rotate(38deg); } to { opacity: 1; transform: translateY(0) rotate(38deg); } }

    .article-tier { opacity: 0; animation: articleTierFadeIn .4s ease-out .95s forwards; }
    @keyframes articleTierFadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (prefers-reduced-motion: reduce) {
      .article-book-group, .article-line, .article-quill, .article-tier { animation: none; opacity: 1; }
      .article-line { opacity: .28; }
    }

    /* =====================================================================
       Kanvas setelah hero — DISALIN PERSIS dari Galeri/Struktur/Kontak
       (.section + .section-transition + .section-blob-drift). ===================================================================== */
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

    .article-section-head { margin-bottom: 28px; }
    .article-section-head h2 { margin: 14px 0 10px; }
    .article-section-subtitle { max-width: 560px; margin: 0 auto; color: var(--color-text-secondary); font-size: 1.02rem; line-height: 1.6; }
    .article-toolbar { max-width: 900px; margin: 0 auto 40px; }

    /* ---------- Empty states ---------- */
    .article-empty-suggestions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 6px; }
    .article-empty-anim { animation: articleEmptyFadeIn .5s var(--ease-out) both; }
    @keyframes articleEmptyFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
    .article-empty-icon { position: relative; animation: articleEmptyIconPop .5s var(--ease-out) .1s both, articleEmptyIconFloat 3.2s ease-in-out .6s infinite; }
    @keyframes articleEmptyIconPop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: scale(1); } }
    @keyframes articleEmptyIconFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    .article-empty-icon-badge {
      display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px;
      border-radius: 50%; margin: 0 auto 14px; color: #fff;
      background: linear-gradient(150deg, var(--color-primary-bright), var(--color-primary));
      box-shadow: 0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent);
    }
    .article-empty-title, .article-empty-desc { animation: articleEmptyFadeIn .5s var(--ease-out) both; }
    .article-empty-title { animation-delay: .18s; }
    .article-empty-desc { animation-delay: .28s; }
    .article-empty-suggestions { animation: articleEmptyFadeIn .5s var(--ease-out) .4s both; }
    .article-empty-suggestions .chip { display: inline-flex; align-items: center; gap: 6px; transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease, background var(--motion-fast) ease, color var(--motion-fast) ease; }
    .article-empty-suggestions .chip:hover { transform: translateY(-3px); box-shadow: var(--shadow-sm); background: var(--color-primary-soft); color: var(--color-primary-dark); }
    @media (prefers-reduced-motion: reduce) {
      .article-empty-anim, .article-empty-icon, .article-empty-title, .article-empty-desc, .article-empty-suggestions { animation: none; opacity: 1; transform: none; }
    }

    /* ---------- Skeleton loading — bentuk kartu editorial (gambar atas +
       beberapa baris teks), supaya tidak ada layout shift saat data datang. ---------- */
    .article-card-skel { background: #fff; border-radius: 20px; border: 1px solid var(--color-border); overflow: hidden; }
    .article-card-skel-media { display: block; aspect-ratio: 3/4; border-radius: 0; }
    .article-card-skel-body { padding: 24px 22px; display: flex; flex-direction: column; gap: 6px; }
    .am-slide-skel { width: 100%; aspect-ratio: 3/4; border-radius: 20px; }

    /* ---------- Desktop: grid kartu editorial ---------- */
    .article-desktop-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px;
      max-width: 1200px; margin: 0 auto;
    }

    .article-card { border-radius: 20px; }
    .article-card-link {
      display: flex; flex-direction: column; height: 100%;
      background: #fff; border: 1px solid var(--color-border); border-radius: 20px; overflow: hidden;
      text-decoration: none; color: inherit; box-shadow: var(--shadow-sm);
      transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s cubic-bezier(.22,1,.36,1);
    }
    @media (hover: hover) and (pointer: fine) {
      .article-card-link:hover { transform: translateY(-8px); box-shadow: 0 26px 50px rgba(0,60,25,.16); text-decoration: none; }
      .article-card-link:hover .article-card-media img { transform: scale(1.08); }
      .article-card-link:hover .article-card-cta app-icon { transform: translateX(3px); }
    }

    .article-card-media { position: relative; aspect-ratio: 3/4; overflow: hidden; background: var(--color-bg-alt); flex-shrink: 0; }
    .article-card-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .6s cubic-bezier(.22,1,.36,1); }
    .article-card-media-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-primary); background: linear-gradient(150deg, var(--color-primary-tint), var(--color-primary-soft)); }
    .article-card-pdf-flag {
      position: absolute; top: 12px; right: 12px; z-index: 2;
      display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 6px;
      background: rgba(15,23,42,.75); color: #fff; font-size: .68rem; font-weight: 700; backdrop-filter: blur(6px);
    }

    /* Pita kategori — mengambang di jahitan gambar->badan (identitas visual
       kartu editorial ini, beda dari badge Galeri yang menumpuk di DALAM
       foto). Ditaruh sebagai anak PERTAMA .article-card-body (bukan lagi
       absolute di dalam .article-card-media) lalu ditarik naik lewat
       margin-top negatif — .article-card-media punya overflow:hidden untuk
       meng-crop gambar ke aspect-ratio-nya, yang ikut memotong separuh pita
       kalau pita itu jadi anak media (dilaporkan: "pill opininya ketutup"). */
    .article-card-category {
      align-self: flex-start;
      position: relative; z-index: 2; margin: -16px 0 14px;
      display: inline-flex; align-items: center; gap: 5px;
      background: #fff; color: var(--color-primary-dark); font-size: .72rem; font-weight: 700;
      padding: 6px 12px; border-radius: var(--radius-full); box-shadow: 0 6px 16px rgba(0,0,0,.14);
    }

    .article-card-body { flex: 1; display: flex; flex-direction: column; padding: 0 22px 20px; }
    .article-card-meta-top { display: flex; gap: 14px; flex-wrap: wrap; font-size: .74rem; color: var(--color-muted); font-weight: 600; }
    .article-card-meta-top span { display: inline-flex; align-items: center; gap: 5px; }

    .article-card-title {
      font-family: var(--font-heading); font-weight: 800; font-size: 1.08rem; line-height: 1.4; color: var(--color-text);
      margin: 10px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .article-card-excerpt {
      flex: 1; margin: 0 0 16px; font-size: .88rem; line-height: 1.65; color: var(--color-text-secondary);
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }

    .article-card-footer {
      margin-top: auto; padding-top: 14px; border-top: 1px solid var(--color-border);
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
    }
    .article-card-writer {
      display: inline-flex; align-items: center; gap: 6px; min-width: 0;
      font-size: .8rem; font-weight: 600; color: var(--color-text-secondary);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .article-card-cta { flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px; font-size: .8rem; font-weight: 700; color: var(--color-primary-dark); }
    .article-card-cta app-icon { transition: transform var(--motion-base) ease; display: inline-flex; }

    /* ---------- Mobile: carousel scroll-snap + dots (disembunyikan di
       >=901px) — kartu mini versi editorial, tap membuka bottom sheet. ---------- */
    .article-mobile-carousel { display: none; }
    .am-track-wrap { margin: 0 -20px; padding: 0 24px; }
    .am-track { display: flex; overflow-x: auto; gap: 16px; padding: 4px 0 16px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .am-track::-webkit-scrollbar { display: none; }
    .am-slide { flex: 0 0 78%; scroll-snap-align: start; display: flex; }

    .am-slide-card {
      display: flex; flex-direction: column; width: 100%; border: none; padding: 0; text-align: left;
      background: #fff; border-radius: 20px; overflow: hidden; box-shadow: var(--shadow);
      cursor: pointer; -webkit-tap-highlight-color: transparent;
    }
    .am-slide-media { position: relative; aspect-ratio: 3/4; overflow: hidden; background: var(--color-bg-alt); flex-shrink: 0; }
    .am-slide-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .am-slide-body { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 8px; }
    .am-slide-body .article-card-category { margin-bottom: 4px; }
    .am-slide-title { font-size: 1rem; font-weight: 800; font-family: var(--font-heading); line-height: 1.32; color: var(--color-text); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .am-slide-excerpt { font-size: .84rem; line-height: 1.55; color: var(--color-text-secondary); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .am-slide-hint {
      display: inline-flex; align-items: center; gap: 5px; width: fit-content; margin-top: 2px;
      font-size: .68rem; font-weight: 700; color: var(--color-primary-dark); background: var(--color-primary-soft);
      padding: 4px 10px; border-radius: var(--radius-full);
    }

    .am-dots { display: flex; justify-content: center; gap: 8px; margin-top: 4px; }
    .am-dot { width: 8px; height: 8px; border-radius: var(--radius-full); border: none; background: var(--color-border-strong); padding: 0; cursor: pointer; transition: width .25s ease, background .25s ease, transform .25s ease, opacity .25s ease; }
    .am-dot.active { width: 22px; background: var(--color-primary); }
    .am-dot.edge:not(.active) { transform: scale(.5); opacity: .5; }

    @media (max-width: 900px) {
      .article-desktop-grid { display: none; }
      .article-mobile-carousel { display: block; }
    }
    @media (max-width: 992px) {
      .article-desktop-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
    }

    /* ---------- Sheet preview ---------- */
    .sheet-image { position: relative; margin: 0 0 14px; border-radius: 14px; overflow: hidden; }
    .sheet-image img { display: block; width: 100%; height: 200px; object-fit: cover; object-position: center top; }
    .sheet-image-fallback { display: flex; align-items: center; justify-content: center; width: 100%; height: 160px; color: var(--color-primary); background: linear-gradient(150deg, var(--color-primary-tint), var(--color-primary-soft)); }
    .sheet-image-badge {
      position: absolute; top: 10px; right: 10px; display: inline-flex; align-items: center; gap: 5px;
      background: rgba(15,23,42,.75); color: #fff; font-size: .72rem; font-weight: 700; padding: 5px 11px; border-radius: var(--radius-full); backdrop-filter: blur(6px);
    }
    .sheet-title { margin: 10px 0 16px; }
    .sheet-meta-rows { margin: 0 0 20px; display: flex; flex-direction: column; gap: 12px; }
    .sheet-meta-row { display: flex; align-items: flex-start; gap: 10px; }
    .sheet-meta-icon { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex-shrink: 0; border-radius: 8px; background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .sheet-meta-label { display: block; font-size: .66rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--color-muted); }
    .sheet-meta-value { display: block; font-size: .88rem; font-weight: 600; color: var(--color-text); }
    .sheet-excerpt { margin: 0; font-size: .88rem; line-height: 1.7; text-align: justify; color: var(--color-text-secondary); }

    .pagination-wrapper { margin-top: 48px; display: flex; justify-content: center; }
  `],
})
export class ArticlePublicIndexPage implements OnInit, AfterViewInit {
  repo = inject(ArticleRepository);
  private router = inject(Router);

  limit = 9;
  currentSort = signal('-publishedDate');
  searchText = signal('');
  /** Nilai filter aktif — key cocok dengan FilterFieldDef.key (lihat
   *  filterFields()): 'category' (slug[]) & 'year' (number[]). */
  filterValues = signal<Record<string, unknown>>({});
  categories = signal<ArticleCategory[]>([]);

  readonly sortOptions: SortOptionDef[] = [
    { value: '-publishedDate', label: 'Terbaru', icon: 'clock' },
    { value: 'publishedDate', label: 'Terlama', icon: 'history' },
    { value: 'articleTitle', label: 'Judul A-Z', icon: 'chevrons-up-down' },
  ];

  /** Field filter Artikel — Kategori (dari categories(), sudah dipakai juga
   *  untuk form CMS) & Tahun Publikasi (dari repo.filterOptions(), distinct
   *  dari data yang benar-benar ada supaya dropdown tidak pernah menawarkan
   *  pilihan yang hasilnya kosong). */
  filterFields = computed<FilterFieldDef[]>(() => {
    const fields: FilterFieldDef[] = [];
    const cats = this.categories();
    if (cats.length) {
      fields.push({
        key: 'category',
        label: 'Kategori',
        icon: 'tags',
        multiple: true,
        options: cats.map((c) => ({ value: c.categorySlug, label: c.categoryName })),
      });
    }
    const years = this.repo.filterOptions()?.years ?? [];
    if (years.length) {
      fields.push({
        key: 'year',
        label: 'Tahun Publikasi',
        icon: 'calendar-days',
        multiple: true,
        options: years.map((y) => ({ value: y, label: String(y) })),
      });
    }
    return fields;
  });

  readonly skeletonItems = Array.from({ length: 6 }, (_, i) => i);

  /** Preview sheet mobile — payload listing sudah memuat articleIntro utuh,
   *  jadi tidak perlu fetch terpisah seperti Galeri (eventDescription-nya
   *  baru ada di endpoint detail). */
  sheetItem = signal<Article | null>(null);

  activeSlide = signal(0);
  @ViewChild('mobileTrack') private mobileTrackRef?: ElementRef<HTMLElement>;
  @ViewChild('sectionHead') private sectionHeadRef?: ElementRef<HTMLElement>;

  /** Indeks titik yang dirender — window geser selebar MAX_MOBILE_DOTS
   *  berpusat di slide aktif, sama seperti Galeri/Struktur Organisasi. */
  dotIndices = computed(() => {
    const total = this.repo.publicArticles().length;
    if (total <= MAX_MOBILE_DOTS) return Array.from({ length: total }, (_, i) => i);
    const half = Math.floor(MAX_MOBILE_DOTS / 2);
    const start = Math.max(0, Math.min(this.activeSlide() - half, total - MAX_MOBILE_DOTS));
    return Array.from({ length: MAX_MOBILE_DOTS }, (_, i) => start + i);
  });

  ngOnInit(): void {
    this.loadData();
    this.repo.loadFilterOptions();
    this.repo.categories().subscribe({ next: (c) => this.categories.set(c), error: () => {} });
  }

  ngAfterViewInit(): void {}

  loadData(page = this.repo.publicPage()): void {
    const filter = this.filterValues();
    this.repo.loadPublic(page, this.limit, this.currentSort(), {
      search: this.searchText(),
      category: filter['category'] as string[] | undefined,
      year: filter['year'] as number[] | undefined,
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
    const total = this.repo.publicArticles().length;
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

  openSheet(item: Article): void {
    this.sheetItem.set(item);
  }

  closeSheet(): void {
    this.sheetItem.set(null);
  }

  goToSheetDetail(): void {
    const item = this.sheetItem();
    if (!item) return;
    this.router.navigate(['/artikel', item.articleSlug]);
  }

  excerpt = plainExcerpt;
  readingTime = readingMinutes;
  imgUrl = resolveImageUrl;
  thumbUrl = resolveThumbnailUrl;
}
