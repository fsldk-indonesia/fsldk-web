import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogBook } from '../../entities/catalog-book';
import { CatalogBookRepository } from '../../repositories/catalogbook.repository';
import { CommentSectionComponent } from '../../../comment/components/comment-section.component';
import { IconComponent } from '../../../../shared/icon.component';
import { resolveImageUrl } from '../../../../core/utils/image-url';
import { CatalogBookPublicDetailPresenter } from './catalogbook.public-detail.presenter';
import { CatalogBookPublicDetailView } from './catalogbook.public-detail.view';

type DetailTab = 'description' | 'synopsis' | 'discussion';

/** Jumlah kartu "Buku Lainnya" yang ditampilkan — diminta 1 lebih dari ini
 *  ke API supaya tetap ada cadangan kalau buku yang sedang dibaca kebetulan
 *  ikut ke-fetch (lihat loadRelated(), pola sama persis Berita). */
const RELATED_COUNT = 4;

/**
 * Halaman detail publik Perpustakaan — pola sama persis dengan Berita detail
 * (hero gelap + cover dalam bingkai matte object-fit:contain di kolom kanan,
 * bento 2-kolom "konten" + sidebar "Informasi Buku" di bawahnya), plus tab
 * Deskripsi/Sinopsis/Diskusi, aksi Baca PDF/Suka, dan "Buku Lainnya" sebagai
 * kartu tambahan khusus Perpustakaan.
 */
@Component({
  selector: 'app-catalogbook-public-detail-page',
  standalone: true,
  imports: [RouterLink, IconComponent, CommentSectionComponent],
  providers: [CatalogBookPublicDetailPresenter],
  template: `
    @if (loading()) {
      <div class="empty-state py-xl">
        <div class="spinner"></div>
        <p class="mt-sm text-muted">Memuat buku...</p>
      </div>
    } @else if (item()) {
      @let b = item()!;
      <!-- ---------- Hero Header — gradien gelap + tekstur, sampul buku
           ditampilkan dalam bingkai kartu (object-fit:contain), pola sama
           persis dengan Berita. ---------- -->
      <header class="hero-section">
        <div class="hero-texture" aria-hidden="true"></div>
        <div class="hero-glow" aria-hidden="true"></div>
        <!-- Siluet buku raksasa pudar di pojok berlawanan — menautkan
             identitas visual hero detail ke motif "buku" yang sama dengan
             kartu index (sebelumnya hero ini generik, tidak berbeda dari
             Berita selain warna). -->
        <span class="hero-book-silhouette" aria-hidden="true"><app-icon name="book-open" [size]="200" /></span>
        <span class="hero-book-silhouette-2" aria-hidden="true"><app-icon name="book" [size]="90" /></span>
        <div class="container hero-grid">
          <div class="hero-copy">
            <div class="hero-badges">
              <span class="hero-tag"><app-icon name="tags" [size]="13" /> {{ b.bookCategoryName }}</span>
              <span class="hero-tag"><app-icon name="check-circle" [size]="13" /> {{ b.availabilityTypeName }}</span>
            </div>

            <span class="hero-event-name"><app-icon name="sparkles" [size]="13" /> Perpustakaan Digital FSLDK Indonesia</span>
            <h1 class="hero-title">{{ b.bookTitle }}</h1>

            <div class="hero-meta-row">
              <span class="hero-meta-item"><app-icon name="user-circle" [size]="14" /> {{ b.authorName }} &middot; {{ b.authorTypeName }}</span>
              <span class="hero-meta-item"><app-icon name="calendar-days" [size]="14" /> {{ b.year }}</span>
              <span class="hero-meta-item"><app-icon name="file-text" [size]="14" /> {{ b.pages }} Halaman</span>
              <span class="hero-meta-item"><app-icon name="globe" [size]="14" /> {{ b.languageName }}</span>
            </div>
          </div>

          <div class="hero-visual">
            <!-- .hero-cover-floater: idle melayang pelan (translateY saja) —
                 dipisah dari .hero-cover-frame yang punya animasi masuk
                 sendiri (scale+opacity), supaya dua animasi transform tidak
                 saling tabrakan di elemen yang sama. -->
            <div class="hero-cover-floater">
              <span class="hero-cover-glow" aria-hidden="true"></span>
              <div class="hero-cover-frame">
                @if (b.coverImage) {
                  <img [src]="imgUrl(b.coverImage)" [alt]="b.bookTitle" class="hero-cover-img" />
                } @else {
                  <div class="hero-cover-fallback"><app-icon name="book" [size]="40" /></div>
                }
                <!-- Pita kategori diagonal — motif sama dengan kartu index,
                     menyatukan bahasa visual hero & listing. -->
                <span class="hero-cover-ribbon">{{ b.bookCategoryName }}</span>
                <!-- Lipatan pojok halaman (dog-ear) — detail skeuomorfik kecil
                     yang menegaskan ini adalah "buku", bukan foto generik. -->
                <span class="hero-cover-fold" aria-hidden="true"></span>
              </div>
              <span class="hero-sparkle hero-sparkle-1" aria-hidden="true"><app-icon name="sparkles" [size]="16" /></span>
              <span class="hero-sparkle hero-sparkle-2" aria-hidden="true"><app-icon name="sparkles" [size]="11" /></span>
            </div>
          </div>
        </div>
      </header>

      <!-- ---------- Bento 2-kolom: konten + sidebar "Informasi Buku",
           "Buku Lainnya" & Diskusi jadi kartu tambahan khusus Perpustakaan. ---------- -->
      <main class="detail-main-section">
        <div class="container">
          <div class="content-layout">
            <nav class="crumb-row" aria-label="Breadcrumb">
              <a routerLink="/" class="crumb-link"><app-icon name="home" [size]="13" /> Beranda</a>
              <app-icon name="chevron-right" [size]="11" class="crumb-sep" />
              <a routerLink="/perpustakaan" class="crumb-link"><app-icon name="book-open" [size]="13" /> Perpustakaan</a>
              <app-icon name="chevron-right" [size]="11" class="crumb-sep" />
              <span class="crumb-current" aria-current="page">{{ b.bookTitle }}</span>
            </nav>

            <div class="story-grid">
              <section class="detail-card story-card-content">
                <div class="tabs-bar">
                  <button type="button" class="tab-btn" [class.active]="tab() === 'description'" (click)="setTab('description')">Deskripsi</button>
                  @if (b.synopsis) {
                    <button type="button" class="tab-btn" [class.active]="tab() === 'synopsis'" (click)="setTab('synopsis')">Sinopsis</button>
                  }
                  <button type="button" class="tab-btn" [class.active]="tab() === 'discussion'" (click)="setTab('discussion')">Diskusi</button>
                </div>

                <!-- Setiap cabang @if DIPISAH per tab (bukan satu wrapper
                     description/synopsis berbagi) supaya Angular selalu
                     membongkar-pasang elemen baru tiap ganti tab — itu yang
                     memicu ulang animasi .tab-panel (CSS animation cuma
                     berjalan saat elemen BARU dimasukkan ke DOM, bukan saat
                     teks di dalam elemen yang sama berubah). -->
                @if (tab() === 'discussion') {
                  <app-comment-section contentType="catalogBook" [contentID]="b.bookID" class="tab-panel" />
                } @else if (tab() === 'synopsis') {
                  <div class="story-lead-text content tab-panel">{{ b.synopsis }}</div>
                } @else {
                  <div class="story-lead-text content tab-panel">{{ b.description }}</div>
                }

                <div class="actions-row">
                  @if (b.bookPdf) {
                    <a [href]="b.bookPdf" target="_blank" rel="noopener" class="action-btn action-btn-primary">
                      <app-icon name="book-open" [size]="15" /> Baca Buku (PDF)
                    </a>
                  } @else {
                    <span class="action-pdf-missing"><app-icon name="info-circle" [size]="13" /> Berkas PDF buku ini belum tersedia.</span>
                  }
                  <button type="button" class="action-btn action-btn-outline" [class.liked]="liked()" [disabled]="liked()" (click)="like()">
                    <app-icon name="heart" [size]="15" /> {{ b.favoriteCount }} Suka
                  </button>
                </div>
              </section>

              <div class="story-sidebar">
                <aside class="detail-card story-card-info">
                  <span class="eyebrow"><app-icon name="sparkles" [size]="13" /> Informasi Buku</span>
                  <ul class="info-rows mt-sm">
                    <li class="info-row">
                      <span class="info-row-icon"><app-icon name="building" [size]="14" /></span>
                      <span class="info-row-text"><b>Penerbit</b>{{ b.publisherName }}</span>
                    </li>
                    @if (b.isbn) {
                      <li class="info-row">
                        <span class="info-row-icon"><app-icon name="hash" [size]="14" /></span>
                        <span class="info-row-text"><b>ISBN</b>{{ b.isbn }}</span>
                      </li>
                    }
                    @if (b.edition) {
                      <li class="info-row">
                        <span class="info-row-icon"><app-icon name="copy" [size]="14" /></span>
                        <span class="info-row-text"><b>Edisi</b>{{ b.edition }}</span>
                      </li>
                    }
                    <li class="info-row">
                      <span class="info-row-icon"><app-icon name="check-circle" [size]="14" /></span>
                      <span class="info-row-text"><b>Ketersediaan</b>{{ b.availabilityTypeName }}</span>
                    </li>
                    <li class="info-row">
                      <span class="info-row-icon"><app-icon name="heart" [size]="14" /></span>
                      <span class="info-row-text"><b>Disukai</b>{{ b.favoriteCount }} pembaca</span>
                    </li>
                  </ul>
                  <a routerLink="/perpustakaan" class="info-cta"><app-icon name="arrow-left" [size]="13" /> Kembali ke Perpustakaan</a>
                </aside>

                @if (relatedBooks().length > 0) {
                  <aside class="detail-card story-card-related">
                    <span class="eyebrow"><app-icon name="book-open" [size]="13" /> Buku Lainnya</span>
                    <div class="related-list mt-sm">
                      @for (item of relatedBooks(); track item.bookID) {
                        <a [routerLink]="['/perpustakaan', item.bookSlug]" class="related-item">
                          <div class="related-item-media">
                            @if (item.coverImage) {
                              <img [src]="imgUrl(item.coverImage)" [alt]="item.bookTitle" loading="lazy" />
                            } @else {
                              <div class="related-item-media-fallback"><app-icon name="book" [size]="16" /></div>
                            }
                          </div>
                          <div class="related-item-body">
                            <h3 class="related-item-title">{{ item.bookTitle }}</h3>
                            <span class="related-item-date">{{ item.authorName }}</span>
                          </div>
                        </a>
                      }
                    </div>
                  </aside>
                }
              </div>
            </div>
          </div>
        </div>
      </main>
    } @else {
      <div class="container py-xl text-center">
        <h2>Buku tidak ditemukan</h2>
        <a routerLink="/perpustakaan" class="btn btn-primary mt">Kembali ke Perpustakaan</a>
      </div>
    }
  `,
  styles: [`
    .crumb-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 20px; }
    .crumb-link { display: inline-flex; align-items: center; gap: 5px; color: var(--color-text-secondary); text-decoration: none; transition: color var(--motion-fast) ease; }
    .crumb-link:hover { color: var(--color-primary-dark); text-decoration: none; }
    .crumb-sep { color: var(--color-border-strong); flex-shrink: 0; }
    .crumb-current { color: var(--color-primary-dark); font-weight: 700; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    @media (max-width: 640px) { .crumb-row { font-size: 0.76rem; gap: 4px; margin-bottom: 14px; } .crumb-current { max-width: 140px; } }

    /* Latar gradasi + tekstur titik — pola sama dengan Berita detail. Sampul
       apa pun kualitasnya tidak bisa merusak tampilan hero (object-fit:contain
       dalam bingkai, bukan latar penuh-layar). */
    .hero-section { position: relative; background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 62%, var(--color-primary-darker) 100%); color: #fff; padding: 64px 0 56px; overflow: hidden; }
    .hero-texture {
      position: absolute; inset: 0; opacity: .5; pointer-events: none;
      background-image: radial-gradient(circle, rgba(255,255,255,.5) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 15% -10px;
      mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
    }
    .hero-glow { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 55% 65% at 88% 30%, rgba(255,196,0,.18) 0%, transparent 70%); }

    /* Siluet buku raksasa pudar — motif yang sama dipakai di section index
       (.book-panel-silhouette), ditautkan ke sini supaya hero detail tidak
       terasa generik/lepas dari identitas "Perpustakaan". */
    .hero-book-silhouette { position: absolute; right: 2%; bottom: -6%; z-index: 0; color: rgba(255,255,255,.08); transform: rotate(-10deg); pointer-events: none; }
    .hero-book-silhouette-2 { position: absolute; left: 4%; top: 6%; z-index: 0; color: rgba(255,255,255,.06); transform: rotate(14deg); pointer-events: none; }

    .hero-grid { position: relative; z-index: 2; display: grid; grid-template-columns: 1.15fr 1fr; gap: 40px; align-items: center; }
    .hero-copy { position: relative; z-index: 2; }

    .hero-badges { display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 10px; margin-bottom: 16px; }
    .hero-tag { background: rgba(255,255,255,.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.25); color: #fff; font-size: .8rem; font-weight: 700; padding: 5px 12px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; }

    .hero-event-name { display: inline-flex; align-items: center; gap: 7px; font-size: 1.1rem; font-weight: 700; color: var(--color-primary-soft); letter-spacing: .03em; margin-bottom: 8px; }
    .hero-event-name app-icon { color: var(--color-gold); animation: heroSparkleTwinkle 2.4s ease-in-out infinite; }
    .hero-title { font-size: 2.2rem; font-weight: 900; font-family: var(--font-heading); line-height: 1.3; color: #fff; margin: 0 0 20px; text-shadow: 0 2px 10px rgba(0,0,0,.4); }

    .hero-meta-row { display: flex; flex-wrap: wrap; gap: 16px; }
    .hero-meta-item { display: inline-flex; align-items: center; gap: 6px; font-size: .86rem; font-weight: 600; color: rgba(255,255,255,.88); }

    .hero-badges, .hero-event-name, .hero-title, .hero-meta-row { opacity: 0; animation: heroCopyFadeUp .7s var(--ease-out) forwards; }
    .hero-badges { animation-delay: .05s; }
    .hero-event-name { animation-delay: .15s; }
    .hero-title { animation-delay: .25s; }
    .hero-meta-row { animation-delay: .4s; }
    @keyframes heroCopyFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

    .hero-visual { position: relative; z-index: 2; display: flex; justify-content: center; }

    /* Pembungkus "melayang" — idle translateY terus-menerus, DIPISAH dari
       .hero-cover-frame yang punya animasi masuk sendiri (scale+opacity).
       Dua animasi transform di elemen yang SAMA akan saling menimpa; di
       parent+child beda elemen, transform-nya menyusun (compose) secara
       alami tanpa konflik. */
    .hero-cover-floater { position: relative; width: 100%; max-width: 340px; animation: heroCoverFloat 5s ease-in-out 1.2s infinite; }
    @keyframes heroCoverFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
    @media (prefers-reduced-motion: reduce) { .hero-cover-floater { animation: none; } }

    /* Glow lembut berdenyut di belakang bingkai sampul — menegaskan sampul
       sebagai fokus visual utama hero, bukan sekadar foto datar. */
    .hero-cover-glow {
      position: absolute; inset: -14%; z-index: 0; border-radius: 50%; pointer-events: none;
      background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,196,0,.28) 0%, transparent 72%);
      animation: heroCoverGlowPulse 3.6s ease-in-out infinite;
    }
    @keyframes heroCoverGlowPulse { 0%, 100% { opacity: .55; transform: scale(1); } 50% { opacity: .9; transform: scale(1.08); } }

    .hero-cover-frame {
      position: relative; z-index: 1; width: 100%;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.25);
      border-radius: 5%; padding: 10px; box-sizing: border-box; overflow: hidden;
      box-shadow: 0 24px 50px rgba(0,0,0,.35);
      opacity: 0; animation: heroCoverIn .7s var(--ease-out) .3s forwards;
    }
    @keyframes heroCoverIn { from { opacity: 0; transform: scale(.92) translateY(10px); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .hero-cover-glow, .hero-cover-frame { animation-duration: .01s; } }

    /* Pita kategori diagonal di pojok sampul — motif identik kartu index
       (.book-ribbon), ditautkan di sini supaya hero & listing terasa satu
       bahasa visual, bukan dua desain lepas. */
    .hero-cover-ribbon {
      position: absolute; top: 14px; left: -38px; z-index: 2; width: 150px;
      text-align: center; transform: rotate(-45deg); transform-origin: center;
      background: linear-gradient(135deg, var(--color-gold), var(--color-gold-dark));
      color: #fff; font-size: .72rem; font-weight: 800; letter-spacing: .02em;
      padding: 5px 0; box-shadow: 0 3px 10px rgba(0,0,0,.25);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    /* Lipatan pojok halaman (dog-ear) — detail skeuomorfik kecil di pojok
       kanan-bawah bingkai, menegaskan "ini buku" bukan foto generik. */
    .hero-cover-fold {
      position: absolute; right: 0; bottom: 0; z-index: 2; width: 26px; height: 26px;
      background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,.9) 50%);
      clip-path: polygon(100% 0, 0% 100%, 100% 100%);
      box-shadow: -2px -2px 6px rgba(0,0,0,.15);
    }

    /* Kerlip sparkle kecil mengambang di sekitar bingkai. */
    .hero-sparkle { position: absolute; z-index: 2; color: var(--color-gold); pointer-events: none; animation: heroSparkleTwinkle 2.6s ease-in-out infinite; }
    .hero-sparkle-1 { top: -10px; right: 8%; animation-delay: .4s; }
    .hero-sparkle-2 { bottom: 12%; left: -6px; animation-delay: 1.3s; }
    @keyframes heroSparkleTwinkle { 0%, 100% { opacity: .35; transform: scale(.85); } 50% { opacity: 1; transform: scale(1.15); } }
    @media (prefers-reduced-motion: reduce) { .hero-sparkle, .hero-event-name app-icon { animation: none; opacity: 1; } }
    .hero-cover-img { display: block; max-width: 100%; max-height: 420px; width: auto; height: auto; object-fit: contain; border-radius: 5%; }
    .hero-cover-fallback { width: 100%; height: 320px; border-radius: 5%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.06); color: rgba(255,255,255,.6); }

    @media (max-width: 900px) {
      .hero-grid { grid-template-columns: 1fr; gap: 28px; }
      .hero-copy { text-align: center; }
      .hero-badges, .hero-meta-row { justify-content: center; }
      .hero-visual { order: -1; }
      .hero-cover-floater { max-width: 260px; }
      .hero-book-silhouette, .hero-book-silhouette-2 { display: none; }
    }

    /* ---------- Kanvas konten — identik .section-blob-drift Berita/Galeri/
       Struktur/Kontak. ---------- */
    .detail-main-section { position: relative; overflow: hidden; padding: 48px 0 80px; background: var(--color-primary-tint); }
    .detail-main-section::before {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 55% 45% at 92% 0%, var(--color-gold-soft) 0%, var(--color-primary-soft) 42%, transparent 72%),
        radial-gradient(ellipse 50% 45% at 4% 28%, var(--color-primary-soft) 0%, var(--color-gold-soft) 45%, transparent 72%);
      opacity: .75; animation: detailBlobDrift 12s ease-in-out infinite alternate;
    }
    .detail-main-section::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: linear-gradient(to bottom, var(--color-primary-tint) 0, rgba(243, 250, 245, 0) 70px);
    }
    .detail-main-section > .container { position: relative; z-index: 1; }
    @keyframes detailBlobDrift { from { transform: translate(0, 0) scale(1); } to { transform: translate(-4%, 5%) scale(1.15); } }
    @media (prefers-reduced-motion: reduce) { .detail-main-section::before { animation: none; } }

    .content-layout { max-width: 1080px; margin: 0 auto; }
    .story-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 24px; margin-bottom: 24px; }
    .story-grid > * { min-width: 0; }
    @media (max-width: 860px) { .story-grid { grid-template-columns: 1fr; } }

    .detail-card { background: #fff; border-radius: 20px; padding: 32px; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); margin-bottom: 24px; }
    .story-grid .detail-card { margin-bottom: 0; }
    .story-sidebar { display: flex; flex-direction: column; gap: 24px; }

    /* Segmented control hijau — Deskripsi/Sinopsis/Diskusi. */
    .tabs-bar { display: inline-flex; gap: 4px; background: var(--color-bg-alt); border-radius: var(--radius-full); padding: 5px; margin-bottom: 22px; }
    .tab-btn { padding: 9px 18px; border: none; background: none; border-radius: var(--radius-full); font-weight: 700; font-size: .84rem; color: var(--color-text-secondary); cursor: pointer; transition: background var(--motion-fast) ease, color var(--motion-fast) ease, box-shadow var(--motion-fast) ease; }

    /* Transisi halus tiap ganti tab (Deskripsi/Sinopsis/Diskusi) — cabang
       @if di template SUDAH dipisah per tab (lihat komentar di sana) supaya
       Angular selalu memasukkan elemen BARU ke DOM tiap ganti tab; animasi
       CSS di sini otomatis terpicu ulang setiap kali itu terjadi (beda dari
       transition biasa yang butuh perubahan properti pada elemen yang SAMA). */
    .tab-panel { animation: tabPanelFadeIn .3s var(--ease-out); }
    @keyframes tabPanelFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @media (prefers-reduced-motion: reduce) { .tab-panel { animation: none; } }
    .tab-btn:hover:not(.active) { color: var(--color-primary-dark); }
    .tab-btn.active { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: #fff; box-shadow: var(--shadow-sm); }

    .story-lead-text.content { font-size: 1.02rem; line-height: 1.9; color: var(--color-text-secondary); white-space: pre-wrap; min-height: 80px; }

    .actions-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--color-border); }
    .action-btn { display: inline-flex; align-items: center; gap: 8px; height: 46px; padding: 0 22px; border-radius: var(--radius-full); font-weight: 700; font-size: .88rem; cursor: pointer; transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease, background var(--motion-fast) ease, color var(--motion-fast) ease; text-decoration: none; }
    .action-btn-primary { border: none; color: #fff; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); box-shadow: 0 8px 22px color-mix(in srgb, var(--color-primary) 38%, transparent); }
    .action-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px color-mix(in srgb, var(--color-primary) 44%, transparent); color: #fff; }
    .action-btn-outline { border: 1.5px solid var(--color-border-strong); background: #fff; color: var(--color-text-secondary); }
    .action-btn-outline:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary-dark); }
    .action-btn-outline.liked { border-color: var(--color-primary); background: var(--color-primary-soft); color: var(--color-primary-dark); cursor: default; }
    .action-btn:disabled { cursor: default; }
    .action-pdf-missing { display: inline-flex; align-items: center; gap: 6px; color: var(--color-muted); font-size: .86rem; font-style: italic; }

    .info-rows { display: flex; flex-direction: column; gap: 14px; list-style: none; margin: 0; padding: 0; }
    .info-row { display: flex; align-items: center; gap: 12px; }
    .info-row-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 32px; height: 32px; border-radius: 10px; background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .info-row-text { display: flex; flex-direction: column; gap: 1px; font-size: 0.86rem; color: var(--color-text); min-width: 0; }
    .info-row-text b { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-muted); }

    .info-cta { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border); font-size: 0.84rem; font-weight: 700; color: var(--color-primary-dark); text-decoration: none; }
    .info-cta:hover { color: var(--color-primary); text-decoration: none; }

    /* ---------- Buku Lainnya — list kompak horizontal, pola sama persis
       "Baca Juga" Berita. ---------- */
    .related-list { display: flex; flex-direction: column; gap: 14px; }
    .related-item { display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; padding: 6px; margin: -6px; border-radius: 12px; transition: background var(--motion-fast) ease; }
    .related-item:hover { background: var(--color-bg-alt); text-decoration: none; }
    .related-item-media { position: relative; flex-shrink: 0; width: 44px; height: 56px; border-radius: 8px; overflow: hidden; background: var(--color-bg-alt); }
    .related-item-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .related-item-media-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-primary); background: var(--color-primary-soft); }
    .related-item-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .related-item-title { margin: 0; font-size: .86rem; font-weight: 700; line-height: 1.35; color: var(--color-text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .related-item-date { font-size: .72rem; color: var(--color-muted); font-weight: 600; }
  `],
})
export class CatalogBookPublicDetailPage implements OnInit, CatalogBookPublicDetailView {
  private presenter = inject(CatalogBookPublicDetailPresenter);
  private route = inject(ActivatedRoute);
  private bookRepo = inject(CatalogBookRepository);

  item = signal<CatalogBook | null>(null);
  loading = signal(true);
  liked = signal(false);
  tab = signal<DetailTab>('description');
  relatedBooks = signal<CatalogBook[]>([]);

  ngOnInit(): void {
    this.presenter.attachView(this);
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.presenter.load(slug);
    this.loadRelated(slug);
  }

  like(): void {
    if (this.liked() || !this.item()) return;
    this.liked.set(true);
    this.presenter.like(this.item()!.bookID);
  }

  setTab(tab: DetailTab): void { this.tab.set(tab); }

  /** Dipanggil langsung lewat repo.publicList() (Observable mentah) supaya
   *  tidak tergantung pada state presenter/view halaman ini — pola sama
   *  persis "Baca Juga" Berita. Minta RELATED_COUNT+1 lalu buang slug yang
   *  sedang dibaca kalau ikut ke-fetch, supaya kartu yang tampil tetap genap. */
  private loadRelated(currentSlug: string): void {
    this.bookRepo.publicList({ page: 1, limit: RELATED_COUNT + 1, sort: 'newest' }).subscribe({
      next: (res) => {
        this.relatedBooks.set(res.data.filter((b) => b.bookSlug !== currentSlug).slice(0, RELATED_COUNT));
      },
      error: () => {},
    });
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setBook(book: CatalogBook | null): void { this.item.set(book); }
  setFavoriteCount(count: number): void {
    const current = this.item();
    if (current) this.item.set({ ...current, favoriteCount: count });
  }

  imgUrl = resolveImageUrl;
}
