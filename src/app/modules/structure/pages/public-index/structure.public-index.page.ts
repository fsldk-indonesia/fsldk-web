import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, computed, inject, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { StructureRepository } from '../../repositories/structure.repository';
import { Structure } from '../../entities/structure';
import { IconComponent } from '../../../../shared/icon.component';
import { BottomSheetComponent } from '../../../../shared/bottom-sheet.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/** Berapa kartu dirender per "halaman" — sisanya baru muncul saat scroll
 *  mendekati ujung (endpoint publik /public/structures memulangkan SEMUA row
 *  tanpa param pagination, jadi windowing dilakukan di klien: data sudah
 *  ter-fetch sekali, yang dibatasi hanya JUMLAH yang dirender). */
const STRUCTURE_PAGE_SIZE = 10;
/** Maksimum titik indikator carousel mobile yang tampak sekaligus — sisanya
 *  digulung lewat window geser (dot tepi mengecil sebagai isyarat "masih ada"),
 *  supaya deretan dot tidak memanjang jadi puluhan saat data banyak. */
const MAX_MOBILE_DOTS = 7;

@Component({
  selector: 'app-structure-public-index',
  standalone: true,
  imports: [IconComponent, BottomSheetComponent, PageHeroComponent],
  template: `
    <!-- Hero publik reusable (shared/page-hero.component.ts): teks lewat input,
         siluet pohon diproyeksikan lewat slot [heroVisual] (style & animasi
         garisnya tetap di sini — lihat animateOrgLines() + .tree-*/.org-* di
         styles). Kartu kutipan Al-Qur'an sudah jadi bagian tetap hero itu. -->
    <app-page-hero
      badge="Struktur Organisasi · FSLDK Indonesia"
      title="Satu Jaringan, Kokoh dalam"
      titleAccent="Struktur Kepengurusan"
      subtitle="Dari Puskomnas di pusat, Puskomda di tiap wilayah, hingga LDK di setiap kampus — satu struktur yang menjaga arah dan kekompakan gerak dakwah se-Indonesia."
      quoteSource="quran">
      <div heroVisual class="hero-org-chart">
            <svg aria-hidden="true" viewBox="0 0 560 320" class="org-svg">
              <defs>
                <radialGradient id="treeCanopyFill" cx="32%" cy="26%" r="78%">
                  <stop offset="0%" stop-color="var(--color-primary-bright)" stop-opacity=".85" />
                  <stop offset="100%" stop-color="var(--color-primary)" stop-opacity=".68" />
                </radialGradient>
                <linearGradient id="treeTrunkFill" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="var(--color-primary-dark)" />
                  <stop offset="45%" stop-color="var(--color-primary)" />
                  <stop offset="100%" stop-color="var(--color-primary-dark)" />
                </linearGradient>
                <!-- Filter "gooey" — blur lalu diambil ulang kontras alfa-nya,
                     dipakai untuk MENYATUKAN beberapa lingkaran tajuk jadi satu
                     gumpalan dedaunan organik tanpa garis jahitan tumpang-tindih
                     (percobaan pertama pakai fill semi-transparent polos tanpa
                     filter ini menyisakan area overlap yang terlihat lebih
                     gelap — jelas kelihatan sebagai "jahitan" antar-lingkaran). -->
                <filter id="treeGooey" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                  <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
                  <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
                <filter id="treeSoftBlur" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" />
                </filter>
              </defs>

              <!-- Siluet "Pohon Dakwah" — akar/batang (Puskomnas) menopang
                   cabang (Puskomda) yang menjulang ke tajuk (LDK), mengikuti
                   perumpamaan QS. Ibrahim:24 ("akarnya kokoh, cabangnya
                   menjulang ke langit"). Tiga lapis memberi kedalaman: bayangan
                   tajuk (digeser turun-kanan), tajuk utama, lalu highlight
                   lembut kiri-atas (kesan tertimpa cahaya) — warna dasar sama
                   persis dengan #islandFill Beranda supaya satu bahasa visual. -->
              <g class="tree-silhouette">
                <ellipse class="tree-ground-shadow" cx="280" cy="308" rx="80" ry="9" filter="url(#treeSoftBlur)" />

                <g class="tree-shadow-blob" filter="url(#treeGooey)" transform="translate(6,7)">
                  <circle cx="175" cy="152" r="48" />
                  <circle cx="385" cy="152" r="48" />
                  <circle cx="280" cy="96" r="56" />
                  <circle cx="222" cy="180" r="40" />
                  <circle cx="338" cy="180" r="40" />
                  <circle cx="280" cy="150" r="50" />
                  <circle cx="150" cy="122" r="26" />
                  <circle cx="410" cy="122" r="26" />
                </g>

                <g class="tree-canopy" filter="url(#treeGooey)">
                  <circle cx="175" cy="150" r="48" />
                  <circle cx="385" cy="150" r="48" />
                  <circle cx="280" cy="94" r="56" />
                  <circle cx="222" cy="178" r="40" />
                  <circle cx="338" cy="178" r="40" />
                  <circle cx="280" cy="148" r="50" />
                  <circle cx="150" cy="120" r="26" />
                  <circle cx="410" cy="120" r="26" />
                </g>

                <g class="tree-canopy-rim" filter="url(#treeSoftBlur)">
                  <circle cx="160" cy="128" r="26" />
                  <circle cx="248" cy="78" r="30" />
                  <circle cx="208" cy="148" r="22" />
                </g>

                <!-- Batang + akar menyatu satu path (flare di pangkal) —
                     kesan berakar kokoh, bukan sekadar tongkat tipis. -->
                <path class="tree-trunk" d="M266,300 C260,300 255,296 257,289 C259,270 264,240 269,205 C271,192 273,180 275,172
                  L285,172 C287,180 289,192 291,205 C296,240 301,270 303,289 C305,296 300,300 294,300
                  C299,296 300,290 293,288 C288,286 280,286 280,286 C280,286 272,286 267,288 C260,290 261,296 266,300 Z" />
                <path class="tree-root" d="M263,297 C250,300 236,303 224,310 C233,303 240,299 248,296 Z" />
                <path class="tree-root" d="M297,297 C310,300 324,303 336,310 C327,303 320,299 312,296 Z" />
              </g>

              <!-- Garis "digambar sendiri" (lihat animateOrgLines()) — jalur utama
                   (Puskomnas->Puskomda, menyusuri batang) lebih tebal/terang
                   dari jalur turunan (Puskomda->LDK, ranting ke tajuk), sama
                   seperti pembagian .network-line/.thick di Beranda. -->
              <path #orgLine class="org-line thick" d="M280,282 L175,150" />
              <path #orgLine class="org-line thick" d="M280,282 L280,120" />
              <path #orgLine class="org-line thick" d="M280,282 L385,150" />
              <path #orgLine class="org-line" d="M175,150 L130,165" />
              <path #orgLine class="org-line" d="M175,150 L155,195" />
              <path #orgLine class="org-line" d="M280,120 L250,80" />
              <path #orgLine class="org-line" d="M280,120 L310,80" />
              <path #orgLine class="org-line" d="M385,150 L405,195" />
              <path #orgLine class="org-line" d="M385,150 L430,165" />

              <!-- Simpul dikelompokkan per-tier supaya bisa fade-in berurutan
                   (hub -> Puskomda -> LDK) mengikuti tempo garis yang sedang
                   "digambar" di baliknya — warna simpul dikode per-tier (hijau/
                   emas/ember), BUKAN acak seperti simpul pulau di Beranda,
                   supaya legenda di bawah svg punya arti langsung. -->
              <g class="org-tier org-tier-0">
                <circle class="network-ping" cx="280" cy="282" r="15" />
                <circle class="network-node" cx="280" cy="282" r="15" />
              </g>
              <g class="org-tier org-tier-1">
                <circle class="network-ping gold" cx="175" cy="150" r="11" style="animation-delay:.3s" />
                <circle class="network-node gold" cx="175" cy="150" r="11" />
                <circle class="network-ping gold" cx="280" cy="120" r="11" style="animation-delay:.6s" />
                <circle class="network-node gold" cx="280" cy="120" r="11" />
                <circle class="network-ping gold" cx="385" cy="150" r="11" style="animation-delay:.9s" />
                <circle class="network-node gold" cx="385" cy="150" r="11" />
              </g>
              <g class="org-tier org-tier-2">
                <circle class="network-node ember" cx="130" cy="165" r="7" />
                <circle class="network-node ember" cx="155" cy="195" r="7" />
                <circle class="network-node ember" cx="250" cy="80" r="7" />
                <circle class="network-node ember" cx="310" cy="80" r="7" />
                <circle class="network-node ember" cx="405" cy="195" r="7" />
                <circle class="network-node ember" cx="430" cy="165" r="7" />
              </g>
            </svg>
          </div>

    </app-page-hero>

    <section class="section section-transition section-blob-drift">
      <div class="container pb-xl">
        @if (loading()) {
          <div class="empty-state">
            <div class="spinner"></div>
            <p>Memuat data struktur...</p>
          </div>
        } @else if (error()) {
          <div class="empty-state">
            <div class="empty-icon text-danger"><app-icon name="alert-triangle" [size]="48" /></div>
            <h3>Terjadi Kesalahan</h3>
            <p>{{ error() }}</p>
            <button class="btn btn-outline mt-md" (click)="loadData()">Coba Lagi</button>
          </div>
        } @else if (items().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><app-icon name="sitemap" [size]="48" /></div>
            <h3>Belum ada data struktur</h3>
            <p>Data struktur kepengurusan belum ditambahkan.</p>
          </div>
        } @else {
          <!-- ---------- Desktop: daftar kartu penuh inline (>=901px) ---------- -->
          <div class="structure-desktop-list">
            @for (s of visibleItems(); track s.structureID; let first = $first; let i = $index) {
              <div class="structure-card stagger-in" [style.--stagger-i]="i % pageSize">
                <div class="structure-card-body">
                  <div class="structure-card-logo">
                    @if (s.logoImage) {
                      <img [src]="imgUrl(s.logoImage)" alt="Logo {{ s.structureName }}">
                    } @else {
                      <div class="placeholder"><app-icon name="image" [size]="48" /></div>
                    }
                  </div>

                  <div class="structure-card-content">
                    <div class="structure-eyebrow">FSLDK Indonesia {{ s.batch }}</div>
                    <h2 class="structure-title">{{ s.structureName }}</h2>

                    <div class="structure-badges">
                      <span class="s-badge s-badge-outline"><app-icon name="calendar-days" [size]="13"/> Masa Amanah {{ s.period }}</span>
                      @if (first) {
                        <span class="s-badge s-badge-gold"><app-icon name="star" [size]="13"/> PENGURUS AKTIF</span>
                      }
                    </div>

                    <div class="structure-desc">
                      <div class="rich-text-display inverse" [innerHTML]="sanitizeHtml(s.structureDescription)"></div>
                    </div>
                  </div>

                  <div class="structure-watermark">{{ s.batch }}</div>
                </div>

                @if (s.structureImage) {
                  <div class="structure-chart-accordion" [class.open]="isChartOpen(s.structureID)">
                    <button type="button" class="chart-summary" (click)="toggleChart(s.structureID)" [attr.aria-expanded]="isChartOpen(s.structureID)">
                      <span class="summary-title"><app-icon name="sitemap" [size]="16"/> BAGAN STRUKTUR</span>
                      <app-icon name="chevron-down" [size]="16" class="summary-icon"/>
                    </button>
                    <div class="chart-grid">
                      <div class="chart-grid-inner">
                        <div class="chart-content">
                          <a [href]="imgUrl(s.structureImage)" target="_blank" rel="noopener noreferrer" class="chart-img-link" title="Buka gambar ukuran penuh">
                            <img [src]="imgUrl(s.structureImage)" alt="Bagan Struktur {{ s.structureName }}" class="chart-img" loading="lazy">
                            <div class="chart-img-overlay">
                              <app-icon name="zoom-in" [size]="32" />
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Sentinel infinite-scroll desktop: hanya ada saat masih ada sisa
               yang belum dirender; IntersectionObserver (lihat ngAfterViewInit)
               memicu loadMore() begitu ia mendekati viewport. -->
          @if (visibleItems().length < items().length) {
            <div #loadMoreSentinel class="load-more-sentinel" aria-hidden="true"></div>
          }

          <!-- ---------- Mobile: carousel scroll-snap + dot indicator, tap kartu
               buka bottom sheet detail (pola sama dengan ldksyahid-app,
               diimplementasikan dengan idiom Angular yang sudah ada di
               fsldk-web — .card-scroller ala Beranda + app-bottom-sheet
               shared, bukan jQuery/Owl Carousel & modal custom). ---------- -->
          <div class="structure-mobile-carousel">
            <div class="ms-track-wrap">
            <div class="ms-track" #mobileTrack (scroll)="onMobileScroll()">
              @for (s of visibleItems(); track s.structureID; let first = $first) {
                <div class="ms-slide">
                  <div class="ms-slide-card">
                    <div class="ms-slide-hero">
                      <div class="ms-slide-hero-row">
                        <div>
                          <div class="ms-slide-eyebrow">FSLDK Indonesia {{ s.batch }}</div>
                          <h3 class="ms-slide-hname">{{ s.structureName }}</h3>
                        </div>
                        @if (first) {
                          <span class="ms-slide-current"><app-icon name="star" [size]="10"/> Pengurus Saat Ini</span>
                        }
                      </div>
                    </div>

                    <div class="ms-slide-photo-area">
                      @if (s.logoImage) {
                        <img [src]="imgUrl(s.logoImage)" alt="Logo {{ s.structureName }}">
                      } @else {
                        <div class="placeholder"><app-icon name="image" [size]="40" /></div>
                      }
                    </div>

                    <div class="ms-slide-info">
                      <p class="ms-slide-period"><app-icon name="calendar-days" [size]="12"/> Masa Amanah {{ s.period }}</p>
                      <p class="ms-slide-desc">{{ plainExcerpt(s.structureDescription) }}</p>
                    </div>

                    <button type="button" class="ms-slide-cta" (click)="openSheet(s)">
                      Lihat Selengkapnya <app-icon name="chevron-right" [size]="13" />
                    </button>
                  </div>
                </div>
              }
            </div>
            </div>

            @if (visibleItems().length > 1) {
              <div class="ms-dots">
                @for (i of dotIndices(); track i) {
                  <button type="button" class="ms-dot" [class.active]="activeSlide() === i" [class.edge]="isEdgeDot(i)" (click)="scrollToSlide(i)" [attr.aria-label]="'Slide ' + (i + 1)"></button>
                }
              </div>
            }
          </div>
        }
      </div>
    </section>

    <!-- ---------- Bottom sheet detail (mobile) — dibuka dari kartu carousel,
         berisi info lengkap + bagan struktur yang sama-sama pakai accordion
         smooth di atas. Komponen shared, tidak reimplement modal baru. ---------- -->
    <app-bottom-sheet [open]="sheetItem() !== null" (closed)="closeSheet()">
      @if (sheetItem(); as s) {
        <div class="sheet-structure">
          <div class="sheet-structure-logo">
            @if (s.logoImage) {
              <img [src]="imgUrl(s.logoImage)" alt="Logo {{ s.structureName }}">
            } @else {
              <div class="placeholder"><app-icon name="image" [size]="40" /></div>
            }
          </div>
          <div class="structure-eyebrow">FSLDK Indonesia {{ s.batch }}</div>
          <h3 class="sheet-structure-title">{{ s.structureName }}</h3>
          <div class="structure-badges">
            <span class="s-badge s-badge-outline-dark"><app-icon name="calendar-days" [size]="13"/> Masa Amanah {{ s.period }}</span>
            @if (items()[0].structureID === s.structureID) {
              <span class="s-badge s-badge-gold"><app-icon name="star" [size]="13"/> PENGURUS AKTIF</span>
            }
          </div>

          <div class="rich-text-display" [innerHTML]="sanitizeHtml(s.structureDescription)"></div>

          @if (s.structureImage) {
            <div class="structure-chart-accordion sheet-chart-accordion" [class.open]="isChartOpen(s.structureID)">
              <button type="button" class="chart-summary" (click)="toggleChart(s.structureID)" [attr.aria-expanded]="isChartOpen(s.structureID)">
                <span class="summary-title"><app-icon name="sitemap" [size]="16"/> BAGAN STRUKTUR</span>
                <app-icon name="chevron-down" [size]="16" class="summary-icon"/>
              </button>
              <div class="chart-grid">
                <div class="chart-grid-inner">
                  <div class="chart-content">
                    <a [href]="imgUrl(s.structureImage)" target="_blank" rel="noopener noreferrer" class="chart-img-link" title="Buka gambar ukuran penuh">
                      <img [src]="imgUrl(s.structureImage)" alt="Bagan Struktur {{ s.structureName }}" class="chart-img" loading="lazy">
                      <div class="chart-img-overlay">
                        <app-icon name="zoom-in" [size]="28" />
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </app-bottom-sheet>
  `,
  styles: [`
    /* Hero shell + kartu kutipan Hadis/Al-Qur'an sudah pindah ke shared
       component (shared/page-hero.component.ts). Yang tersisa di sini HANYA
       style ilustrasi siluet pohon yang diproyeksikan ke slot [heroVisual]
       (projected content di-style oleh komponen pemroyeksi, yaitu di sini). */

    /* ---------- Siluet hero: diagram hierarki (bukan peta) — Puskomnas di
       puncak, Puskomda di tengah, LDK sebagai daun, garis "digambar sendiri"
       saat load (animateOrgLines()), simpul berdenyut pakai kelas global
       .network-node/.network-ping/.network-line (styles.scss) yang sudah
       jadi primitif "Peta Silaturahmi" di seluruh app — dipakai ulang di
       sini supaya bahasa visualnya konsisten dengan Beranda/footer. ---------- */
    .hero-org-chart { position: relative; width: 100%; }
    .org-svg { position: relative; z-index: 1; width: 100%; height: 240px; overflow: visible; }

    /* ---------- Siluet "Pohon Dakwah" — tumbuh dulu (scale+fade dari bawah,
       transform-origin di pangkal batang) sebelum garis jaringan mulai
       "digambar" di atasnya (lihat delay +700ms di animateOrgLines() &
       delay tier di bawah) — urutan animasi meniru pohon yang benar-benar
       tumbuh baru kemudian "menyala" jaringannya, bukan semua muncul
       bersamaan. Warna fill sama persis dengan #islandFill Beranda. ---------- */
    .tree-silhouette {
      transform-box: fill-box; transform-origin: 50% 100%; opacity: 0;
      animation: treeGrow .9s cubic-bezier(.34,1.4,.64,1) forwards;
      filter: drop-shadow(0 10px 18px rgba(0,147,59,.22));
    }
    @keyframes treeGrow { from { opacity: 0; transform: scale(.75) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .tree-trunk { fill: url(#treeTrunkFill); }
    .tree-root { fill: url(#treeTrunkFill); }
    .tree-shadow-blob { fill: var(--color-primary-dark); opacity: .35; }
    .tree-canopy { fill: url(#treeCanopyFill); }
    .tree-canopy-rim { fill: #eafff1; opacity: .3; }
    .tree-ground-shadow { fill: var(--color-primary-dark); opacity: .14; }
    @media (prefers-reduced-motion: reduce) { .tree-silhouette { animation: none; opacity: 1; transform: none; } }

    .org-line { fill: none; stroke: var(--color-primary); stroke-width: 1.8; stroke-linecap: round; opacity: .55; }
    .org-line.thick { stroke-width: 2.6; opacity: .75; stroke: var(--color-primary-bright); }
    .org-tier { opacity: 0; animation: orgTierFadeIn .4s ease-out forwards; }
    .org-tier-0 { animation-delay: .75s; }
    .org-tier-1 { animation-delay: 1.3s; }
    .org-tier-2 { animation-delay: 1.8s; }
    @keyframes orgTierFadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* =====================================================================
       Kanvas setelah hero — DISALIN PERSIS dari Beranda (.section +
       .section-transition + .section-blob-drift, lihat home.index.page.ts),
       bukan lagi kelas kustom .section-list. Kunci hilangnya seam ke wave ada
       di .section-blob-drift::after: fade-mask yang menutup 70px TERATAS (dan
       terbawah) section dengan var(--color-primary-tint) RATA — jadi tepi atas
       section selalu tint polos yang identik dengan fill wave, apa pun posisi
       blob gradient yang bergerak di baliknya. Blob drift (::before) memberi
       gerak halus hijau→emas biar kanvas tidak terasa flat mati, sama seperti
       3 section pilihan di Beranda. .section base (bg tint + position) &
       .section-transition (padding-top 32px) melengkapi paritas visualnya.

       Sebelumnya di sini flat tint tanpa mask; ternyata glow emas .hero::after
       yang menimpa .hero::before di sudut kanan-bawah masih menyisakan rona
       creamy di zona wave, jadi tepi atas section (tint murni) tetap terbaca
       beda → seam. Fade-mask 70px inilah yang menyamakannya, persis mekanisme
       yang dipakai Beranda. ===================================================================== */
    .section { background: var(--color-primary-tint); position: relative; }
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

    /* ---------- Desktop: daftar kartu penuh ---------- */
    .structure-desktop-list { display: flex; flex-direction: column; gap: 40px; max-width: 1080px; margin: 0 auto; }

    .structure-card { background: var(--color-primary-dark); border-radius: 20px; box-shadow: var(--shadow-lg); overflow: hidden; position: relative; transition: transform var(--motion-base) var(--ease-out), box-shadow var(--motion-base) ease; }
    @media (hover: hover) and (pointer: fine) {
      .structure-card:hover { transform: translateY(-4px); box-shadow: 0 24px 48px rgba(0,0,0,.18); }
    }

    .structure-card-body { position: relative; display: flex; gap: 32px; padding: 40px; z-index: 2; overflow: hidden; }

    .structure-card-logo { width: 220px; height: 220px; flex-shrink: 0; background: #fff; border-radius: 24px; padding: 12px; box-shadow: var(--shadow); z-index: 2; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .structure-card-logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 12px; }
    .structure-card-logo .placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-muted); background: var(--color-bg-alt); border-radius: 12px; }

    .structure-card-content { flex: 1; z-index: 2; color: #fff; }

    .structure-eyebrow { font-size: 0.9rem; font-weight: 800; letter-spacing: 0.02em; color: var(--color-primary-soft); margin-bottom: 8px; }
    .structure-title { font-size: 2.2rem; font-weight: 800; color: #fff; font-family: var(--font-heading); margin: 0 0 16px; letter-spacing: -0.02em; line-height: 1.2; }

    .structure-badges { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 32px; }
    .s-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 700; padding: 6px 12px; border-radius: 6px; }
    .s-badge-outline { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); }
    .s-badge-outline-dark { background: var(--color-primary-soft); color: var(--color-primary-dark); border: 1px solid var(--color-primary-soft); }
    .s-badge-gold { background: var(--color-gold); color: #fff; }

    .structure-desc { font-size: 1.05rem; line-height: 1.7; color: rgba(255,255,255,0.9); }
    ::ng-deep .rich-text-display.inverse p { color: rgba(255,255,255,0.9) !important; margin-bottom: 12px; }
    ::ng-deep .rich-text-display.inverse h1, ::ng-deep .rich-text-display.inverse h2, ::ng-deep .rich-text-display.inverse h3 { color: #fff !important; }

    .structure-watermark { position: absolute; right: -20px; bottom: -60px; font-size: 300px; font-weight: 900; line-height: 1; color: rgba(255,255,255,0.03); z-index: 1; user-select: none; pointer-events: none; }

    /* ---------- Bagan struktur: accordion smooth (grid-template-rows 0fr/1fr)
       menggantikan <details>/<summary> native yang sebelumnya snap instan —
       tinggi animasi mengikuti tinggi ASLI konten (tidak perlu tebak
       max-height), tanpa dependency @angular/animations. Dipakai ulang
       persis sama untuk kartu desktop maupun bottom sheet mobile. ---------- */
    .structure-chart-accordion { background: #fff; border-top: 1px solid rgba(0,0,0,0.05); }
    .chart-summary {
      display: flex; align-items: center; justify-content: space-between; width: 100%;
      padding: 20px 40px; background: none; border: none; font: inherit; color: inherit; text-align: left;
      cursor: pointer; transition: background 0.2s;
    }
    .chart-summary:hover { background: var(--color-bg-warm); }
    .summary-title { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 0.95rem; color: var(--color-text-secondary); letter-spacing: 0.02em; }
    .summary-icon { color: var(--color-primary); background: var(--color-primary-soft); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: transform 0.3s ease; }

    .structure-chart-accordion.open .summary-icon { transform: rotate(180deg); }
    .structure-chart-accordion.open .chart-summary { border-bottom: 1px solid var(--color-border); }

    .chart-grid { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .45s cubic-bezier(.4,0,.2,1); }
    .structure-chart-accordion.open .chart-grid { grid-template-rows: 1fr; }
    .chart-grid-inner { overflow: hidden; }

    .chart-content { padding: 40px; background: var(--color-bg-warm); }

    .chart-img-link { display: block; position: relative; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-border); background: #fff; }
    .chart-img { display: block; width: 100%; height: auto; object-fit: contain; }
    .chart-img-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: #fff; opacity: 0; transition: opacity .2s ease; }
    .chart-img-link:hover .chart-img-overlay { opacity: 1; }

    /* ---------- Mobile: carousel scroll-snap + dots (>=901px disembunyikan)
       menggantikan reflow kolom lama — satu kartu ringkas per slide, "Lihat
       Selengkapnya" membuka bottom sheet berisi detail lengkap. ---------- */
    .structure-mobile-carousel { display: none; }
    /* Gutter kiri-kanan HARUS ada di wrapper yang TIDAK ikut scroll (.ms-track-wrap),
       BUKAN di .ms-track (elemen overflow-x:auto) itu sendiri — percobaan
       sebelumnya taruh padding langsung di .ms-track ternyata "dimakan" browser:
       scroll-snap-type:x mandatory membuat scrollLeft awal auto-lompat sejumlah
       PERSIS nilai padding-left itu sendiri (dikonfirmasi lewat devtools: dengan
       padding-left 36px, scrollLeft awal = 36, bukan 0) — jadi gutter yang
       dimaksud selalu ke-scroll keluar layar sebelum sempat terlihat, berapa pun
       besar nilainya. Pola yang benar meniru .goods-panel-cards-wrap (bukan
       scroller) > .goods-panel-track (scroller, TANPA padding horizontal sama
       sekali) di Beranda — satu-satunya carousel lain di app ini yang sudah
       terbukti benar. */
    .ms-track-wrap { margin: 0 -20px; padding: 0 24px; }
    .ms-track {
      display: flex; overflow-x: auto; gap: 16px; padding: 4px 0 16px;
      scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none;
    }
    .ms-track::-webkit-scrollbar { display: none; }
    .ms-slide { flex: 0 0 74%; scroll-snap-align: start; display: flex; }

    /* ---------- Kartu mobile — layout & proporsi disamakan PERSIS dengan
       referensi ldksyahid-app (.ms-mobile-card/.ms-mob-hero/.ms-mob-photo-area/
       .ms-mob-info/.ms-view-chart-btn di landing-page/about/management-structure),
       cuma warnanya diganti ke palet hijau/emas FSLDK — bukan lagi kartu hijau
       tua polos gaya kartu desktop, tapi header band + foto besar + info putih
       + tombol footer full-width seperti aslinya. ---------- */
    /* box-shadow lebih kecil dari var(--shadow-lg) — kartu desktop biasa
       (pola sama seperti sheet-panel/dsb) pakai shadow besar karena berdiri
       sendiri di kanvas luas; di carousel mobile yang rapat & berdempetan,
       shadow besar (36px blur) malah "bocor" menimpa kartu sebelah dan bikin
       barisnya terasa berat/mepet, bukan renggang. */
    .ms-slide-card { width: 100%; height: 100%; background: #fff; border-radius: 20px; box-shadow: var(--shadow); border: 1px solid var(--color-border); overflow: hidden; display: flex; flex-direction: column; }

    .ms-slide-hero { position: relative; background: linear-gradient(130deg, var(--color-primary) 0%, var(--color-primary-dark) 55%, var(--color-primary-darker) 100%); padding: 18px 20px 16px; overflow: hidden; }
    .ms-slide-hero::before { content: ''; position: absolute; top: -25px; right: -25px; width: 90px; height: 90px; background: rgba(255,255,255,.1); border-radius: 50%; pointer-events: none; }
    .ms-slide-hero-row { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .ms-slide-eyebrow { font-size: .68rem; font-weight: 700; color: rgba(255,255,255,.75); text-transform: uppercase; letter-spacing: 1.6px; margin-bottom: 4px; }
    .ms-slide-hname { font-size: 1rem; font-weight: 800; color: #fff; line-height: 1.3; margin: 0; font-family: var(--font-heading); }
    .ms-slide-current {
      display: inline-flex; align-items: center; gap: 4px; background: linear-gradient(135deg, var(--color-gold), var(--color-gold-dark));
      color: #fff; font-size: .62rem; font-weight: 700; padding: 4px 10px; border-radius: var(--radius-full);
      text-transform: uppercase; letter-spacing: .3px; white-space: nowrap; flex-shrink: 0; box-shadow: 0 2px 8px rgba(217,154,31,.4);
    }

    .ms-slide-photo-area { background: linear-gradient(135deg, var(--color-primary-tint) 0%, var(--color-primary-soft) 55%, var(--color-gold-soft) 100%); padding: 24px 20px; display: flex; align-items: center; justify-content: center; min-height: 190px; }
    .ms-slide-photo-area img { max-width: 100%; max-height: 170px; width: auto; height: auto; object-fit: contain; border-radius: 14px; filter: drop-shadow(0 4px 14px rgba(0,0,0,.13)); display: block; }
    .ms-slide-photo-area .placeholder { width: 96px; height: 96px; display: flex; align-items: center; justify-content: center; color: var(--color-muted); background: #fff; border-radius: 14px; }

    .ms-slide-info { padding: 18px 20px 16px; border-top: 1px solid rgba(0,0,0,.04); flex: 1; }
    .ms-slide-period { display: flex; align-items: center; gap: 6px; font-size: .78rem; color: var(--color-primary-dark); font-weight: 600; margin: 0 0 8px; }
    .ms-slide-desc { font-size: .84rem; color: var(--color-text-secondary); line-height: 1.65; margin: 0; }

    .ms-slide-cta {
      display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; border: none;
      border-top: 1px solid var(--color-border); padding: 14px; background: var(--color-primary-soft); color: var(--color-primary-dark);
      font-size: .88rem; font-weight: 700; cursor: pointer; transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .ms-slide-cta:active { background: linear-gradient(135deg, var(--color-primary-bright), var(--color-primary-dark)); color: #fff; }
    .ms-dots { display: flex; justify-content: center; gap: 8px; margin-top: 4px; }
    .ms-dot { width: 8px; height: 8px; border-radius: var(--radius-full); border: none; background: var(--color-border-strong); padding: 0; cursor: pointer; transition: width .25s ease, background .25s ease, transform .25s ease, opacity .25s ease; }
    .ms-dot.active { width: 22px; background: var(--color-primary); }
    /* Dot tepi window geser (ada lagi di luar window) — dikecilkan sebagai
       isyarat "masih ada slide lain". Dot aktif menang: tak ikut mengecil. */
    .ms-dot.edge:not(.active) { transform: scale(.5); opacity: .5; }

    /* Penanda tak terlihat di ujung list; jadi target IntersectionObserver
       untuk memuat halaman berikutnya (tanpa tinggi/latar sendiri). */
    .load-more-sentinel { width: 100%; height: 1px; }

    @media (max-width: 900px) {
      .structure-desktop-list { display: none; }
      .structure-mobile-carousel { display: block; }
    }

    /* ---------- Bottom sheet: detail struktur ---------- */
    .sheet-structure { padding-top: 4px; }
    .sheet-structure-logo { width: 84px; height: 84px; margin: 0 auto 16px; background: #fff; border: 1px solid var(--color-border); border-radius: 18px; padding: 10px; box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .sheet-structure-logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
    .sheet-structure-logo .placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-muted); background: var(--color-bg-alt); border-radius: 8px; }
    .sheet-structure .structure-eyebrow { text-align: center; color: var(--color-primary-dark); }
    .sheet-structure-title { font-size: 1.25rem; font-weight: 800; font-family: var(--font-heading); text-align: center; margin: 0 0 14px; }
    .sheet-structure .structure-badges { justify-content: center; margin-bottom: 20px; }
    .sheet-structure .rich-text-display { margin-bottom: 4px; }
    .sheet-chart-accordion { border: 1px solid var(--color-border); border-radius: 14px; margin-top: 20px; overflow: hidden; }
    .sheet-chart-accordion .chart-summary { padding: 16px 20px; }
    .sheet-chart-accordion .chart-content { padding: 20px; }
  `],
})
export class StructurePublicIndexPage implements OnInit, AfterViewInit, OnDestroy {
  private repo = inject(StructureRepository);
  private sanitizer = inject(DomSanitizer);

  items = signal<Structure[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  openChartIds = signal<Set<number>>(new Set());
  sheetItem = signal<Structure | null>(null);
  activeSlide = signal(0);

  /** Windowing render: cuma `visibleCount` kartu pertama yang dirender; nambah
   *  per STRUCTURE_PAGE_SIZE saat scroll (desktop: sentinel + IO; mobile: dekat
   *  ujung track). pageSize diekspos ke template untuk reset stagger per halaman. */
  readonly pageSize = STRUCTURE_PAGE_SIZE;
  visibleCount = signal(STRUCTURE_PAGE_SIZE);
  visibleItems = computed(() => this.items().slice(0, this.visibleCount()));

  /** Indeks titik yang dirender — kalau slide melebihi MAX_MOBILE_DOTS, pakai
   *  window geser selebar MAX_MOBILE_DOTS yang berpusat di slide aktif, jadi
   *  jumlah dot tetap ringkas berapa pun total datanya. */
  dotIndices = computed(() => {
    const total = this.visibleItems().length;
    if (total <= MAX_MOBILE_DOTS) return Array.from({ length: total }, (_, i) => i);
    const half = Math.floor(MAX_MOBILE_DOTS / 2);
    const start = Math.max(0, Math.min(this.activeSlide() - half, total - MAX_MOBILE_DOTS));
    return Array.from({ length: MAX_MOBILE_DOTS }, (_, i) => start + i);
  });

  @ViewChildren('orgLine') private orgLineRefs!: QueryList<ElementRef<SVGPathElement>>;
  @ViewChild('mobileTrack') private mobileTrackRef?: ElementRef<HTMLElement>;
  @ViewChildren('loadMoreSentinel') private sentinelRefs!: QueryList<ElementRef<HTMLElement>>;
  private loadMoreObserver?: IntersectionObserver;

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.animateOrgLines();
    // Infinite-scroll desktop: observe sentinel di ujung list; rootMargin
    // memuat lebih awal sebelum benar-benar terlihat. sentinelRefs.changes
    // menyambung ulang observer tiap sentinel muncul/hilang (ia di dalam @if).
    this.loadMoreObserver = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) this.loadMore(); },
      { rootMargin: '240px 0px' },
    );
    this.observeLoadMoreSentinel();
    this.sentinelRefs.changes.subscribe(() => this.observeLoadMoreSentinel());
  }

  ngOnDestroy(): void {
    this.loadMoreObserver?.disconnect();
  }

  private observeLoadMoreSentinel(): void {
    this.loadMoreObserver?.disconnect();
    const el = this.sentinelRefs?.first?.nativeElement;
    if (el) this.loadMoreObserver?.observe(el);
  }

  /** Perbesar jendela render satu halaman; berhenti kalau sudah semua. */
  private loadMore(): void {
    if (this.visibleCount() >= this.items().length) return;
    this.visibleCount.update((v) => Math.min(v + STRUCTURE_PAGE_SIZE, this.items().length));
  }

  isEdgeDot(i: number): boolean {
    const total = this.visibleItems().length;
    if (total <= MAX_MOBILE_DOTS) return false;
    const w = this.dotIndices();
    const first = w[0];
    const last = w[w.length - 1];
    return (i === first && first > 0) || (i === last && last < total - 1);
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);
    this.repo.listPublic().subscribe({
      next: (data) => { this.items.set(data); this.visibleCount.set(STRUCTURE_PAGE_SIZE); this.activeSlide.set(0); this.loading.set(false); },
      error: (err) => { this.error.set(err.error?.message || 'Gagal memuat data struktur'); this.loading.set(false); },
    });
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

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  isChartOpen(id: number): boolean {
    return this.openChartIds().has(id);
  }

  toggleChart(id: number): void {
    const next = new Set(this.openChartIds());
    if (next.has(id)) { next.delete(id); } else { next.add(id); }
    this.openChartIds.set(next);
  }

  openSheet(item: Structure): void {
    this.sheetItem.set(item);
  }

  closeSheet(): void {
    this.sheetItem.set(null);
  }

  plainExcerpt(html: string, max = 130): string {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.length > max ? `${text.slice(0, max).trim()}…` : text;
  }

  onMobileScroll(): void {
    const track = this.mobileTrackRef?.nativeElement;
    if (!track) return;
    const slideWidth = track.firstElementChild?.clientWidth || track.clientWidth;
    this.activeSlide.set(Math.round(track.scrollLeft / (slideWidth + 16)));
    // Dekat ujung kanan track → muat halaman berikutnya (infinite-scroll mobile).
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - slideWidth - 8) this.loadMore();
  }

  scrollToSlide(index: number): void {
    const track = this.mobileTrackRef?.nativeElement;
    if (!track) return;
    const slideWidth = track.firstElementChild?.clientWidth || track.clientWidth;
    track.scrollTo({ left: index * (slideWidth + 16), behavior: 'smooth' });
  }

  /** Efek "bagan digambar sendiri" — sama seperti animateIslandPath() di
   *  Beranda: stroke di-dash sepanjang total panjang path (getTotalLength(),
   *  bukan angka tebakan) lalu dashoffset dianimasikan lewat Web Animations
   *  API, digilir per-garis (index * 130ms) mengikuti urutan hierarki
   *  (Puskomnas->Puskomda dulu, baru Puskomda->LDK). Menghormati
   *  prefers-reduced-motion — langsung tampil penuh tanpa animasi. */
  private animateOrgLines(): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.orgLineRefs?.forEach((ref, i) => {
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
}
