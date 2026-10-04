import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { EventRepository } from '../../repositories/event.repository';
import { Event } from '../../entities/event';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { BottomSheetComponent } from '../../../../shared/bottom-sheet.component';
import { SearchFilterSortComponent, FilterFieldDef, SortOptionDef } from '../../../../shared/search-filter-sort.component';
import { resolveImageUrl, resolveThumbnailUrl } from '../../../../core/utils/image-url';

/** Maksimum titik indikator carousel mobile yang tampak sekaligus — pola
 *  sama seperti Artikel/Galeri (lihat article.public-index.page.ts). */
const MAX_MOBILE_DOTS = 7;

/** Teks polos dari eventContent (rich HTML) untuk excerpt kartu/sheet — HANYA
 *  dipakai sebagai teks biasa (bukan innerHTML), jadi aman tanpa DomSanitizer. */
function plainExcerpt(html: string | null | undefined, maxLen = 150): string {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '…';
}

/**
 * Public landing page for browsing events. Hero publik reusable
 * (shared/page-hero.component.ts) — bahasa visual sama dengan Artikel/
 * Galeri/Struktur. Kartu Event (.event-card) SENGAJA disamakan persis
 * dengan kartu "Event Terbaru" di Beranda (home.index.page.ts) — foto
 * poster penuh + overlay gradasi bawah, badge tanggal, chip status detail
 * (Pendaftaran Dibuka/Ditutup, Berlangsung/Selesai) — supaya bahasa visual
 * kartu Event konsisten di seluruh situs, bukan desain baru per halaman.
 */
@Component({
  selector: 'app-event-public-index-page',
  standalone: true,
  imports: [RouterLink, DatePipe, IconComponent, PaginationComponent, PageHeroComponent, BottomSheetComponent, SearchFilterSortComponent],
  template: `
    <app-page-hero
      badge="Agenda &amp; Kegiatan · FSLDK Indonesia"
      title="Semangat &amp;"
      titleAccent="Syiar Dakwah Kampus"
      subtitle="Agenda, kajian, dan program kerja jaringan LDK se-Indonesia — satu kalender gerak dakwah yang terus hidup dari kampus ke kampus."
      quoteSource="hadith">
      <!-- Siluet sisi kanan hero: kalender + lonceng pengumuman (pola sama
           "tumbuh scale+fade" seperti buku Artikel/kamera Galeri) — sel
           tanggal fade-in stagger, satu sel gold menyala sebagai "hari-H",
           lonceng pengumuman jatuh menyusul, simpul berdenyut sudut terakhir. -->
      <div heroVisual class="hero-event-cal">
        <svg aria-hidden="true" viewBox="0 0 560 320" class="event-cal-svg">
          <defs>
            <linearGradient id="eventCalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ffffff" stop-opacity=".97" />
              <stop offset="100%" stop-color="var(--color-primary-soft)" stop-opacity=".92" />
            </linearGradient>
            <linearGradient id="eventCalHeader" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="var(--color-primary-bright)" />
              <stop offset="100%" stop-color="var(--color-primary-dark)" />
            </linearGradient>
            <filter id="eventSoftBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>

          <g class="event-cal-group">
            <ellipse class="event-cal-shadow" cx="280" cy="268" rx="150" ry="11" filter="url(#eventSoftBlur)" />

            <rect class="event-cal-body" x="140" y="90" width="280" height="170" rx="16" />
            <rect class="event-cal-header" x="140" y="90" width="280" height="46" rx="16" />
            <rect class="event-cal-ring" x="192" y="76" width="14" height="28" rx="7" />
            <rect class="event-cal-ring" x="354" y="76" width="14" height="28" rx="7" />

            <rect class="event-cal-cell" x="164" y="152" width="34" height="28" rx="6" style="animation-delay:.45s" />
            <rect class="event-cal-cell" x="208" y="152" width="34" height="28" rx="6" style="animation-delay:.5s" />
            <rect class="event-cal-cell" x="252" y="152" width="34" height="28" rx="6" style="animation-delay:.55s" />
            <rect class="event-cal-cell event-cal-cell-highlight" x="296" y="152" width="34" height="28" rx="6" style="animation-delay:.6s" />
            <rect class="event-cal-cell" x="340" y="152" width="34" height="28" rx="6" style="animation-delay:.65s" />
            <rect class="event-cal-cell" x="164" y="192" width="34" height="28" rx="6" style="animation-delay:.7s" />
            <rect class="event-cal-cell" x="208" y="192" width="34" height="28" rx="6" style="animation-delay:.75s" />
            <rect class="event-cal-cell" x="252" y="192" width="34" height="28" rx="6" style="animation-delay:.8s" />

            <g class="event-cal-bell" transform="rotate(18 372 110)">
              <path d="M372,78 a22,22 0 0 1 22,22 v18 a10,10 0 0 0 6,9 v6 h-56 v-6 a10,10 0 0 0 6,-9 v-18 a22,22 0 0 1 22,-22 z" fill="var(--color-gold)" />
              <circle cx="372" cy="139" r="7" fill="var(--color-gold-dark)" />
            </g>
          </g>

          <g class="event-cal-tier">
            <circle class="network-ping gold" cx="152" cy="84" r="8" />
            <circle class="network-node gold" cx="152" cy="84" r="8" />
            <circle class="network-ping" cx="408" cy="84" r="7" style="animation-delay:.3s" />
            <circle class="network-node" cx="408" cy="84" r="7" />
          </g>
        </svg>
      </div>
    </app-page-hero>

    <section class="section section-transition section-blob-drift">
      <div class="container pb-xl">
        <div class="event-section-head text-center reveal" #sectionHead>
          <h2>Kalender Agenda &amp; Kegiatan</h2>
          <p class="event-section-subtitle">Ikuti kajian, pelatihan, dan program kerja dari jaringan LDK se-Indonesia — daftar sebelum kuota penuh.</p>
        </div>

        <div class="event-toolbar">
          <app-search-filter-sort
            searchPlaceholder="Cari judul event atau divisi..."
            [searchValue]="searchText()"
            [filterFields]="filterFields()"
            [filterValues]="filterValues()"
            [sortOptions]="sortOptions"
            [sortValue]="currentSort()"
            filterTitle="Filter Event"
            filterSubtitle="Pilih divisi, tahun pelaksanaan, dan status untuk menyaring event."
            [filterMobileSheet]="true"
            (searchChange)="onSearchChange($event)"
            (filterApply)="onFilterApply($event)"
            (sortChange)="onSortChange($event)"
          />
        </div>

        @if (repo.loading()) {
          <div class="event-desktop-grid" aria-hidden="true">
            @for (i of skeletonItems; track i) {
              <span class="skel event-card-skel"></span>
            }
          </div>
          <div class="event-mobile-carousel" aria-hidden="true">
            <div class="em-track-wrap">
              <div class="em-track">
                @for (i of skeletonItems; track i) {
                  <div class="em-slide"><div class="em-slide-skel skel"></div></div>
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
        } @else if (repo.publicEvents().length === 0 && hasActiveSearchOrFilter()) {
          <div class="empty-state event-empty-anim">
            <span class="event-empty-icon event-empty-icon-badge">
              <app-icon name="search" [size]="26" />
            </span>
            <h3 class="event-empty-title">Event Tidak Ditemukan</h3>
            <p class="event-empty-desc">Coba ubah kata kunci atau hapus beberapa filter yang aktif.</p>
            <div class="event-empty-suggestions">
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
        } @else if (repo.publicEvents().length === 0) {
          <div class="empty-state event-empty-anim">
            <div class="empty-icon event-empty-icon"><app-icon name="megaphone" [size]="48" /></div>
            <h3 class="event-empty-title">Belum Ada Event</h3>
            <p class="event-empty-desc">Agenda dan kegiatan akan muncul di sini setelah dipublikasikan.</p>
          </div>
        } @else {
          <!-- ---------- Desktop: grid kartu "poster" (>=901px) — foto penuh
               + overlay gradasi bawah menampung judul/lokasi/tanggal, badge
               tanggal mengambang gaya agenda-mini-date, chip status detail
               (Pendaftaran Dibuka/Ditutup untuk upcoming, Berlangsung/Selesai
               untuk sisanya). Kartu ini DISALIN PERSIS dari section "Event
               Terbaru" Beranda (home.index.page.html .event-card) supaya
               bahasa visual kartu Event konsisten di seluruh situs — jangan
               styling ulang dari nol di sini kalau pola Beranda berubah,
               selaraskan keduanya. ---------- -->
          <div class="event-desktop-grid">
            @for (e of repo.publicEvents(); track e.eventID; let i = $index) {
              <a [routerLink]="['/event', e.eventSlug]" class="event-card stagger-in" [style.--stagger-i]="i">
                <div class="event-card-media">
                  @if (e.eventImage) {
                    <img [src]="thumbUrl(e.eventImage)" [alt]="e.eventTitle" loading="lazy" />
                  } @else {
                    <div class="event-card-media-fallback"><app-icon name="megaphone" [size]="30" /></div>
                  }
                  <span class="event-card-overlay" aria-hidden="true"></span>
                  @if (e.startDate) {
                    <span class="event-date-badge">
                      <span class="day">{{ e.startDate | date: 'd' }}</span>
                      <span class="mon">{{ e.startDate | date: 'MMM' }}</span>
                    </span>
                  }
                  @if (e.status === 'upcoming') {
                    <span class="event-status-chip" [class.open]="e.registOpen" [class.closed]="!e.registOpen">
                      {{ e.registOpen ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup' }}
                    </span>
                  } @else {
                    <span class="event-status-chip" [class.ongoing]="e.status === 'ongoing'" [class.past]="e.status === 'past'">
                      {{ e.status === 'ongoing' ? 'Berlangsung' : 'Selesai' }}
                    </span>
                  }
                  <div class="event-card-caption">
                    <div class="event-card-tags">
                      <span class="chip chip-green">{{ e.eventDivision }}</span>
                      @if (e.tag) { <span class="event-tag-pill"><app-icon name="hash" [size]="10" /> {{ e.tag }}</span> }
                    </div>
                    <h3>{{ e.eventTitle }}</h3>
                    <p class="event-card-date-range"><app-icon name="calendar" [size]="12" /> {{ eventDateRange(e) }}</p>
                    @if (e.location) { <p class="event-card-location"><app-icon name="map-pin" [size]="12" /> {{ eventLocationText(e) }}</p> }
                    <span class="event-card-hover-cta">Lihat Detail <app-icon name="chevron-right" [size]="11" /></span>
                  </div>
                </div>
              </a>
            } @empty {
              <div class="empty-state" style="grid-column:1/-1">
                <div class="empty-icon"><app-icon name="megaphone" [size]="48" /></div>
                <h3>Belum Ada Event</h3>
              </div>
            }
          </div>

          <!-- ---------- Mobile: carousel scroll-snap + dot indicator, tap
               kartu membuka bottom sheet berisi preview lengkap. ---------- -->
          <div class="event-mobile-carousel">
            <div class="em-track-wrap">
              <div class="em-track" #mobileTrack (scroll)="onMobileScroll()">
                @for (e of repo.publicEvents(); track e.eventID; let i = $index) {
                  <div class="em-slide stagger-in" [style.--stagger-i]="i">
                    <!-- Kartu mobile SAMA PERSIS kartu desktop (.event-card
                         poster) — bedanya cuma elemen pembungkus button (buka
                         bottom sheet preview) bukan anchor (navigasi langsung). -->
                    <button type="button" class="event-card em-slide-card" (click)="openSheet(e)">
                      <div class="event-card-media">
                        @if (e.eventImage) {
                          <img [src]="thumbUrl(e.eventImage)" [alt]="e.eventTitle" loading="lazy" />
                        } @else {
                          <div class="event-card-media-fallback"><app-icon name="megaphone" [size]="26" /></div>
                        }
                        <span class="event-card-overlay" aria-hidden="true"></span>
                        @if (e.startDate) {
                          <span class="event-date-badge">
                            <span class="day">{{ e.startDate | date: 'd' }}</span>
                            <span class="mon">{{ e.startDate | date: 'MMM' }}</span>
                          </span>
                        }
                        @if (e.status === 'upcoming') {
                          <span class="event-status-chip" [class.open]="e.registOpen" [class.closed]="!e.registOpen">
                            {{ e.registOpen ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup' }}
                          </span>
                        } @else {
                          <span class="event-status-chip" [class.ongoing]="e.status === 'ongoing'" [class.past]="e.status === 'past'">
                            {{ e.status === 'ongoing' ? 'Berlangsung' : 'Selesai' }}
                          </span>
                        }
                        <div class="event-card-caption">
                          <div class="event-card-tags">
                            <span class="chip chip-green">{{ e.eventDivision }}</span>
                            @if (e.tag) { <span class="event-tag-pill"><app-icon name="hash" [size]="10" /> {{ e.tag }}</span> }
                          </div>
                          <h3>{{ e.eventTitle }}</h3>
                          <p class="event-card-date-range"><app-icon name="calendar" [size]="12" /> {{ eventDateRange(e) }}</p>
                          @if (e.location) { <p class="event-card-location"><app-icon name="map-pin" [size]="12" /> {{ eventLocationText(e) }}</p> }
                        </div>
                      </div>
                    </button>
                  </div>
                }
              </div>
            </div>

            @if (repo.publicEvents().length > 1) {
              <div class="em-dots">
                @for (i of dotIndices(); track i) {
                  <button type="button" class="em-dot" [class.active]="activeSlide() === i" [class.edge]="isEdgeDot(i)" (click)="scrollToSlide(i)" [attr.aria-label]="'Slide ' + (i + 1)"></button>
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
                itemLabel="event"
                (pageChange)="onPageChange($event)"
              />
            </div>
          }
        }
      </div>
    </section>

    <!-- ---------- Bottom sheet mobile: preview event ---------- -->
    <app-bottom-sheet
      [open]="sheetItem() !== null"
      (closed)="closeSheet()"
      ctaLabel="Lihat Detail Event"
      (ctaClick)="goToSheetDetail()"
    >
      @if (sheetItem(); as item) {
        <div class="sheet-image">
          @if (item.eventImage) {
            <img [src]="imgUrl(item.eventImage)" [alt]="item.eventTitle">
          } @else {
            <div class="sheet-image-fallback"><app-icon name="megaphone" [size]="34" /></div>
          }
          @if (item.status === 'upcoming') {
            <span class="event-status-chip sheet-image-badge" [class.open]="item.registOpen" [class.closed]="!item.registOpen">
              {{ item.registOpen ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup' }}
            </span>
          } @else {
            <span class="event-status-chip sheet-image-badge" [class.ongoing]="item.status === 'ongoing'" [class.past]="item.status === 'past'">
              {{ item.status === 'ongoing' ? 'Berlangsung' : 'Selesai' }}
            </span>
          }
        </div>
        <span class="chip chip-green">{{ item.eventDivision }}</span>
        <h3 class="sheet-title">{{ item.eventTitle }}</h3>
        <div class="sheet-meta-rows">
          @if (item.startDate) {
            <div class="sheet-meta-row">
              <span class="sheet-meta-icon"><app-icon name="calendar-days" [size]="13" /></span>
              <span>
                <span class="sheet-meta-label">Waktu</span>
                <span class="sheet-meta-value">{{ item.startDate | date: 'd MMMM y' }}{{ item.endDate && item.endDate !== item.startDate ? ' – ' + (item.endDate | date: 'd MMMM y') : '' }}</span>
              </span>
            </div>
          }
          @if (item.location) {
            <div class="sheet-meta-row">
              <span class="sheet-meta-icon"><app-icon name="map-pin" [size]="13" /></span>
              <span>
                <span class="sheet-meta-label">Lokasi</span>
                <span class="sheet-meta-value">{{ item.location }}{{ item.place ? ', ' + item.place : '' }}</span>
              </span>
            </div>
          }
        </div>
        <p class="sheet-excerpt">{{ excerpt(item.eventContent, 220) }}</p>
      }
    </app-bottom-sheet>
  `,
  styles: [`
    /* ---------- Siluet hero: kalender + lonceng pengumuman ---------- */
    .hero-event-cal { position: relative; width: 100%; }
    .event-cal-svg { position: relative; z-index: 1; width: 100%; height: 240px; overflow: visible; }

    .event-cal-group {
      transform-box: fill-box; transform-origin: 50% 100%; opacity: 0;
      animation: eventCalGrow .9s cubic-bezier(.34,1.4,.64,1) forwards;
      filter: drop-shadow(0 10px 18px rgba(0,147,59,.18));
    }
    @keyframes eventCalGrow { from { opacity: 0; transform: scale(.75) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

    .event-cal-shadow { fill: var(--color-primary-dark); opacity: .14; }
    .event-cal-body { fill: url(#eventCalFill); stroke: var(--color-border); }
    .event-cal-header { fill: url(#eventCalHeader); }
    .event-cal-ring { fill: var(--color-border-strong); }
    .event-cal-cell { fill: var(--color-primary); opacity: 0; animation: eventCellFadeIn .4s ease-out forwards; }
    @keyframes eventCellFadeIn { from { opacity: 0; } to { opacity: .22; } }
    .event-cal-cell-highlight { fill: var(--color-gold); animation: eventCellFadeInGold .4s ease-out forwards; }
    @keyframes eventCellFadeInGold { from { opacity: 0; } to { opacity: .85; } }

    .event-cal-bell { transform-box: fill-box; transform-origin: 50% 100%; opacity: 0; animation: eventBellDrop .5s var(--ease-out) .62s forwards; }
    @keyframes eventBellDrop { from { opacity: 0; transform: translateY(-14px) rotate(18deg); } to { opacity: 1; transform: translateY(0) rotate(18deg); } }

    .event-cal-tier { opacity: 0; animation: eventTierFadeIn .4s ease-out .95s forwards; }
    @keyframes eventTierFadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (prefers-reduced-motion: reduce) {
      .event-cal-group, .event-cal-cell, .event-cal-cell-highlight, .event-cal-bell, .event-cal-tier { animation: none; opacity: 1; }
      .event-cal-cell { opacity: .22; }
    }

    /* =====================================================================
       Kanvas setelah hero — DISALIN PERSIS dari Artikel/Galeri/Struktur. ===================================================================== */
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

    .event-section-head { margin-bottom: 28px; }
    .event-section-head h2 { margin: 14px 0 10px; }
    .event-section-subtitle { max-width: 560px; margin: 0 auto; color: var(--color-text-secondary); font-size: 1.02rem; line-height: 1.6; }
    .event-toolbar { max-width: 900px; margin: 0 auto 40px; }

    /* ---------- Empty states ---------- */
    .event-empty-suggestions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 6px; }
    .event-empty-anim { animation: eventEmptyFadeIn .5s var(--ease-out) both; }
    @keyframes eventEmptyFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
    .event-empty-icon { position: relative; animation: eventEmptyIconPop .5s var(--ease-out) .1s both, eventEmptyIconFloat 3.2s ease-in-out .6s infinite; }
    @keyframes eventEmptyIconPop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: scale(1); } }
    @keyframes eventEmptyIconFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    .event-empty-icon-badge {
      display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px;
      border-radius: 50%; margin: 0 auto 14px; color: #fff;
      background: linear-gradient(150deg, var(--color-primary-bright), var(--color-primary));
      box-shadow: 0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent);
    }
    .event-empty-title, .event-empty-desc { animation: eventEmptyFadeIn .5s var(--ease-out) both; }
    .event-empty-title { animation-delay: .18s; }
    .event-empty-desc { animation-delay: .28s; }
    .event-empty-suggestions { animation: eventEmptyFadeIn .5s var(--ease-out) .4s both; }
    .event-empty-suggestions .chip { display: inline-flex; align-items: center; gap: 6px; transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease, background var(--motion-fast) ease, color var(--motion-fast) ease; }
    .event-empty-suggestions .chip:hover { transform: translateY(-3px); box-shadow: var(--shadow-sm); background: var(--color-primary-soft); color: var(--color-primary-dark); }
    @media (prefers-reduced-motion: reduce) {
      .event-empty-anim, .event-empty-icon, .event-empty-title, .event-empty-desc, .event-empty-suggestions { animation: none; opacity: 1; transform: none; }
    }

    /* ---------- Skeleton loading — bentuk poster polos (aspect-ratio 3/4),
       biar tidak ada layout shift saat data datang (kartu asli juga poster
       penuh, tanpa body putih terpisah). ---------- */
    .event-card-skel { display: block; width: 100%; aspect-ratio: 3/4; border-radius: var(--radius-lg); }
    .em-slide-skel { width: 100%; aspect-ratio: 3/4; border-radius: 20px; }

    /* ---------- Desktop: grid kartu "poster" ---------- */
    .event-desktop-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px;
      max-width: 1200px; margin: 0 auto;
    }

    /* ---------- Kartu Event "poster" — DISALIN PERSIS dari section "Event
       Terbaru" Beranda (home.index.page.ts .event-card) supaya bahasa visual
       kartu Event konsisten lintas situs: foto penuh + overlay gradasi
       bawah menampung judul/lokasi/tanggal, badge tanggal mengambang gaya
       agenda-mini-date, chip status detail (Pendaftaran Dibuka/Ditutup untuk
       upcoming, Berlangsung/Selesai untuk sisanya). Dipakai utk kartu desktop
       (anchor) MAUPUN kartu mobile carousel (button, lihat .em-slide-card). ---------- */
    .event-card {
      position: relative; display: block; aspect-ratio: 3/4; border-radius: var(--radius-lg); overflow: hidden;
      box-shadow: var(--shadow-sm); transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out);
      text-decoration: none; color: inherit;
    }
    @media (hover: hover) and (pointer: fine) {
      .event-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); text-decoration: none; }
      .event-card:hover .event-card-media img { transform: scale(1.06); }
      .event-card:hover .event-card-hover-cta { opacity: 1; transform: translateY(0); }
    }
    .event-card-media { position: relative; width: 100%; height: 100%; background: var(--color-primary-soft); }
    .event-card-media img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--motion-slow) ease; }
    .event-card-media-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-primary); background: linear-gradient(150deg, var(--color-primary-tint), var(--color-primary-soft)); }
    .event-card-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(4,20,10,.9) 0%, rgba(4,20,10,.3) 58%, transparent 78%);
    }
    .event-date-badge {
      position: absolute; top: 14px; left: 14px; display: flex; flex-direction: column; align-items: center;
      background: #fff; border-radius: 12px; padding: 6px 10px; box-shadow: var(--shadow-sm); line-height: 1;
    }
    .event-date-badge .day { font-family: var(--font-heading); font-weight: 800; font-size: 1.2rem; color: var(--color-primary-dark); }
    .event-date-badge .mon { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); }
    .event-status-chip {
      position: absolute; top: 14px; right: 14px; max-width: calc(100% - 90px); background: rgba(255,255,255,.92); color: var(--color-primary-dark);
      font-size: .68rem; font-weight: 800; padding: 4px 10px; border-radius: var(--radius-full); text-align: right;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .event-status-chip.open { background: var(--color-gold); color: #fff; }
    .event-status-chip.closed { background: rgba(255,255,255,.7); color: var(--color-muted); }
    .event-status-chip.ongoing { background: var(--color-gold); color: #fff; }
    .event-status-chip.past { background: rgba(255,255,255,.7); color: var(--color-muted); }
    .event-card-caption { position: absolute; left: 0; right: 0; bottom: 0; padding: 18px; color: #fff; }
    .event-card-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 8px; }
    .event-card-tags .chip { margin-bottom: 0; }
    .event-tag-pill {
      display: inline-flex; align-items: center; gap: 4px; background: rgba(255,255,255,.16); color: #fff;
      font-size: .7rem; font-weight: 600; padding: 3px 9px; border-radius: var(--radius-full);
    }
    .event-card-caption h3 { color: #fff; margin: 0 0 8px; font-size: 1.05rem; line-height: 1.3; }
    .event-card-date-range, .event-card-location {
      display: flex; align-items: center; gap: 5px; margin: 0 0 4px; font-size: .78rem; color: rgba(255,255,255,.85);
    }
    .event-card-location:last-of-type { margin-bottom: 0; }
    .event-card-hover-cta {
      display: flex; align-items: center; gap: 4px; margin-top: 10px; font-size: .78rem; font-weight: 700;
      color: #fff; opacity: 0; transform: translateY(4px);
      transition: opacity var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    @media (max-width: 900px) {
      .event-card-hover-cta { display: none; }
    }

    /* ---------- Mobile: carousel scroll-snap + dots ---------- */
    .event-mobile-carousel { display: none; }
    .em-track-wrap { margin: 0 -20px; padding: 0 24px; }
    .em-track { display: flex; overflow-x: auto; gap: 16px; padding: 4px 0 16px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .em-track::-webkit-scrollbar { display: none; }
    .em-slide { flex: 0 0 78%; scroll-snap-align: start; display: flex; }

    /* Reset tombol — tampilan posternya sendiri sudah datang dari .event-card
       (lihat markup: class="event-card em-slide-card" di template). */
    .em-slide-card { display: block; width: 100%; border: none; padding: 0; background: transparent; cursor: pointer; -webkit-tap-highlight-color: transparent; }

    .em-dots { display: flex; justify-content: center; gap: 8px; margin-top: 4px; }
    .em-dot { width: 8px; height: 8px; border-radius: var(--radius-full); border: none; background: var(--color-border-strong); padding: 0; cursor: pointer; transition: width .25s ease, background .25s ease, transform .25s ease, opacity .25s ease; }
    .em-dot.active { width: 22px; background: var(--color-primary); }
    .em-dot.edge:not(.active) { transform: scale(.5); opacity: .5; }

    @media (max-width: 900px) {
      .event-desktop-grid { display: none; }
      .event-mobile-carousel { display: block; }
    }
    @media (max-width: 992px) {
      .event-desktop-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
    }

    /* ---------- Sheet preview ---------- */
    .sheet-image { position: relative; margin: 0 0 14px; border-radius: 14px; overflow: hidden; }
    .sheet-image img { display: block; width: 100%; height: 200px; object-fit: cover; object-position: center top; }
    .sheet-image-fallback { display: flex; align-items: center; justify-content: center; width: 100%; height: 160px; color: var(--color-primary); background: linear-gradient(150deg, var(--color-primary-tint), var(--color-primary-soft)); }
    .sheet-image-badge { top: 10px; right: 10px; }
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
export class EventPublicIndexPage implements OnInit, AfterViewInit {
  repo = inject(EventRepository);
  private router = inject(Router);
  /** DatePipe BUKAN providedIn:'root' di Angular — instansiasi manual (bukan
   *  inject()), pola sama persis home.index.page.ts, supaya tidak perlu
   *  provider eksplisit di komponen standalone ini. */
  private datePipe = new DatePipe('id-ID');

  limit = 9;
  currentSort = signal('newest');
  searchText = signal('');
  /** Nilai filter aktif — key cocok dengan FilterFieldDef.key (lihat
   *  filterFields()): 'division' (string[]), 'year' (number[]), 'status' (string[]). */
  filterValues = signal<Record<string, unknown>>({});

  readonly sortOptions: SortOptionDef[] = [
    { value: 'newest', label: 'Terbaru', icon: 'clock' },
    { value: 'oldest', label: 'Terlama', icon: 'history' },
    { value: 'title', label: 'Judul A-Z', icon: 'chevrons-up-down' },
  ];

  /** Field filter Event — Divisi & Tahun dari repo.filterOptions() (distinct
   *  dari data yang benar-benar ada, pola sama Artikel), Status selalu
   *  tampil (3 opsi tetap upcoming/ongoing/past, bukan dari filterOptions). */
  filterFields = computed<FilterFieldDef[]>(() => {
    const fields: FilterFieldDef[] = [];
    const divisions = this.repo.filterOptions()?.divisions ?? [];
    if (divisions.length) {
      fields.push({ key: 'division', label: 'Divisi Penyelenggara', icon: 'users', multiple: true, options: divisions.map((d) => ({ value: d, label: d })) });
    }
    const years = this.repo.filterOptions()?.years ?? [];
    if (years.length) {
      fields.push({ key: 'year', label: 'Tahun Pelaksanaan', icon: 'calendar-days', multiple: true, options: years.map((y) => ({ value: y, label: String(y) })) });
    }
    fields.push({
      key: 'status',
      label: 'Status',
      icon: 'list-checks',
      multiple: true,
      options: [
        { value: 'upcoming', label: 'Akan Datang' },
        { value: 'ongoing', label: 'Berlangsung' },
        { value: 'past', label: 'Telah Selesai' },
      ],
    });
    return fields;
  });

  readonly skeletonItems = Array.from({ length: 6 }, (_, i) => i);

  /** Preview sheet mobile — payload listing sudah memuat eventContent utuh
   *  (lihat event_repository_impl.go selectCols), jadi openSheet() cukup set
   *  signal langsung tanpa fetch terpisah. */
  sheetItem = signal<Event | null>(null);

  activeSlide = signal(0);
  @ViewChild('mobileTrack') private mobileTrackRef?: ElementRef<HTMLElement>;
  @ViewChild('sectionHead') private sectionHeadRef?: ElementRef<HTMLElement>;

  dotIndices = computed(() => {
    const total = this.repo.publicEvents().length;
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
      division: filter['division'] as string[] | undefined,
      year: filter['year'] as number[] | undefined,
      status: filter['status'] as string[] | undefined,
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
    const total = this.repo.publicEvents().length;
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

  openSheet(item: Event): void {
    this.sheetItem.set(item);
  }

  closeSheet(): void {
    this.sheetItem.set(null);
  }

  goToSheetDetail(): void {
    const item = this.sheetItem();
    if (!item) return;
    this.router.navigate(['/event', item.eventSlug]);
  }

  /** Rentang tanggal kartu — "8 Des 2026" (satu hari) atau "8 Des – 17 Des
   *  2026" (rentang), pola sama persis eventDateRange() Beranda. */
  eventDateRange(e: Event): string {
    if (!e.startDate) return '';
    if (!e.endDate || new Date(e.startDate).toDateString() === new Date(e.endDate).toDateString()) {
      return this.datePipe.transform(e.startDate, 'd MMM yyyy') ?? '';
    }
    const start = this.datePipe.transform(e.startDate, 'd MMM') ?? '';
    const end = this.datePipe.transform(e.endDate, 'd MMM yyyy') ?? '';
    return `${start} – ${end}`;
  }

  eventLocationText(e: Event): string {
    if (e.location && e.place) return `${e.location} — ${e.place}`;
    return e.location || e.place || '';
  }

  excerpt = plainExcerpt;
  imgUrl = resolveImageUrl;
  thumbUrl = resolveThumbnailUrl;
}
