import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NewsRepository } from '../../repositories/news.repository';
import { News } from '../../entities/news';
import { IconComponent } from '../../../../shared/icon.component';
import { CommentSectionComponent } from '../../../comment/components/comment-section.component';
import { resolveImageUrl, resolveThumbnailUrl } from '../../../../core/utils/image-url';

/** Jumlah kartu "Baca Juga" yang ditampilkan — diminta 1 lebih dari ini ke
 *  API supaya tetap ada cadangan kalau artikel yang sedang dibaca kebetulan
 *  ikut ke-fetch (lihat loadRelated()). */
const RELATED_COUNT = 3;

/**
 * Public detail page for a single news article — konsep "artikel editorial"
 * (kolom baca sempit, byline inline, drop-cap), SENGAJA BEDA dari hero gelap
 * + bento 2-kolom Galeri: Berita adalah bacaan panjang (konten teks utama),
 * Galeri adalah dokumentasi visual (foto/video sebagai konten utama) — dua
 * jenis konten yang wajar punya bahasa tata letak berbeda. Kanvas
 * section-blob-drift tetap sama (konsistensi lintas halaman publik), tapi
 * TIDAK ada hero-section gelap terpisah — masthead artikel menyatu langsung
 * di kanvas terang yang sama dengan index Berita.
 */
@Component({
  selector: 'app-news-public-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe, IconComponent, CommentSectionComponent],
  template: `
    @if (repo.loading()) {
      <div class="empty-state py-xl">
        <div class="spinner"></div>
        <p class="mt-sm text-muted">Memuat berita...</p>
      </div>
    } @else if (repo.error()) {
      <div class="container py-xl text-center">
        <div class="empty-icon text-danger"><app-icon name="alert-triangle" [size]="48" /></div>
        <h3>Terjadi Kesalahan</h3>
        <p class="text-muted">{{ repo.error() }}</p>
        <a routerLink="/berita" class="btn btn-outline mt-md">Kembali ke Berita</a>
      </div>
    } @else {
      @if (repo.currentNews(); as n) {
        <section class="section section-transition section-blob-drift">
          <div class="container pb-xl">
            <div class="article-layout">
              <nav class="crumb-row" aria-label="Breadcrumb">
                <a routerLink="/" class="crumb-link"><app-icon name="home" [size]="13" /> Beranda</a>
                <app-icon name="chevron-right" [size]="11" class="crumb-sep" />
                <a routerLink="/berita" class="crumb-link"><app-icon name="newspaper" [size]="13" /> Berita</a>
                <app-icon name="chevron-right" [size]="11" class="crumb-sep" />
                <span class="crumb-current" aria-current="page">{{ n.newsTitle }}</span>
              </nav>

              <!-- ---------- Masthead artikel — bukan hero gelap terpisah,
                   menyatu di kanvas terang yang sama. Byline INLINE (bukan
                   kartu sidebar "Ringkasan" ala Galeri) karena ini bacaan
                   satu alur, bukan dasbor fakta. ---------- -->
              <header class="article-masthead">
                <div class="article-badges">
                  <span class="chip chip-green">{{ n.categoryName }}</span>
                  @if (n.isFeatured) {
                    <span class="chip chip-gold"><app-icon name="star" [size]="11" /> Unggulan</span>
                  }
                </div>
                <h1 class="article-title">{{ n.newsTitle }}</h1>
                <div class="article-byline">
                  <span class="byline-item"><app-icon name="user-circle" [size]="14" /> {{ n.newsReporter || n.authorName }}</span>
                  @if (n.publishedDate) {
                    <span class="byline-sep" aria-hidden="true">&middot;</span>
                    <span class="byline-item"><app-icon name="calendar-days" [size]="14" /> {{ n.publishedDate | date: 'd MMMM yyyy' }}</span>
                  }
                  <span class="byline-sep" aria-hidden="true">&middot;</span>
                  <span class="byline-item"><app-icon name="eye" [size]="14" /> {{ n.viewCount }} kali dibaca</span>
                </div>
              </header>

              <!-- ---------- Cover — banner lebar INLINE di alur artikel
                   (bukan dibingkai matte kecil di samping hero ala Galeri);
                   kalau tidak ada gambar, blok ini dilewati sama sekali
                   (halaman teks-dulu tidak butuh kotak placeholder). ---------- -->
              @if (n.newsImage) {
                <figure class="article-cover">
                  <img [src]="imgUrl(n.newsImage)" [alt]="n.newsTitle" />
                </figure>
              }

              <!-- ---------- Satu kartu artikel mengalir (BUKAN bento 2-kolom
                   dengan sidebar fakta terpisah) — kolom baca sempit (820px)
                   supaya nyaman dibaca, drop-cap di paragraf pertama sebagai
                   penanda "ini artikel", bukan "ini dasbor dokumentasi". ---------- -->
              <article class="detail-card article-body">
                <div class="content" [innerHTML]="sanitizeHtml(n.newsContent)"></div>

                @if (n.newsEditor || n.newsPublisher) {
                  <div class="article-credits">
                    @if (n.newsEditor) { <span><b>Editor:</b> {{ n.newsEditor }}</span> }
                    @if (n.newsPublisher) { <span><b>Penerbit:</b> {{ n.newsPublisher }}</span> }
                  </div>
                }

                <a routerLink="/berita" class="back-link mt-lg"><app-icon name="arrow-left" [size]="13" /> Kembali ke Berita</a>
              </article>

              <!-- ---------- Baca Juga — berita lain selain yang sedang
                   dibaca, dorongan baca lanjut sebelum masuk ke komentar.
                   Dipanggil langsung lewat NewsApiService (bukan lewat
                   repo.loadPublic()) supaya TIDAK menimpa repo.loading()/
                   repo.publicNews() yang dipakai index — sama pola dengan
                   sheet preview Galeri. ---------- -->
              @if (relatedNews().length > 0) {
                <section class="related-section">
                  <h2 class="related-heading"><app-icon name="newspaper" [size]="16" /> Baca Juga</h2>
                  <div class="related-grid">
                    @for (item of relatedNews(); track item.newsID) {
                      <a [routerLink]="['/berita', item.newsSlug]" class="related-card">
                        <div class="related-media">
                          @if (item.newsImage) {
                            <img [src]="thumbUrl(item.newsImage)" [alt]="item.newsTitle" loading="lazy" />
                          } @else {
                            <div class="related-media-fallback"><app-icon name="newspaper" [size]="22" /></div>
                          }
                        </div>
                        <div class="related-body">
                          <span class="related-cat">{{ item.categoryName }}</span>
                          <h3 class="related-title">{{ item.newsTitle }}</h3>
                          @if (item.publishedDate) {
                            <span class="related-date"><app-icon name="calendar-days" [size]="11" /> {{ item.publishedDate | date: 'd MMM y' }}</span>
                          }
                        </div>
                      </a>
                    }
                  </div>
                </section>
              }

              <section class="detail-card article-comments">
                <app-comment-section contentType="news" [contentID]="n.newsID" />
              </section>
            </div>
          </div>
        </section>
      } @else {
        <div class="container py-xl text-center">
          <h2>Berita tidak ditemukan</h2>
          <a routerLink="/berita" class="btn btn-primary mt">Kembali ke Berita</a>
        </div>
      }
    }
  `,
  styles: [`
    .crumb-row {
      display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
      font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary);
      margin-bottom: 24px;
    }
    .crumb-link { display: inline-flex; align-items: center; gap: 5px; color: var(--color-text-secondary); text-decoration: none; transition: color var(--motion-fast) ease; }
    .crumb-link:hover { color: var(--color-primary-dark); text-decoration: none; }
    .crumb-sep { color: var(--color-border-strong); flex-shrink: 0; }
    .crumb-current {
      color: var(--color-primary-dark); font-weight: 700;
      max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    @media (max-width: 640px) {
      .crumb-row { font-size: 0.76rem; gap: 4px; margin-bottom: 16px; }
      .crumb-current { max-width: 140px; }
    }

    /* ---------- Kanvas — identik .section-blob-drift Galeri/Struktur/
       Kontak/Berita-index, TAPI TIDAK ada hero gelap terpisah di atasnya
       (beda sengaja dari Galeri detail) — masthead artikel langsung duduk
       di kanvas terang ini. ---------- */
    .section { background: var(--color-primary-tint); position: relative; min-height: 70vh; }
    .section-transition { position: relative; padding-top: 48px; }
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
    @media (prefers-reduced-motion: reduce) { .section-blob-drift::before { animation: none; } }

    /* ---------- Kolom baca sempit — 820px, BUKAN 1080px bento lebar ala
       Galeri. Lebar yang lebih sempit ini sendiri yang membuat halaman
       terasa "artikel", bukan "dasbor dokumentasi". ---------- */
    .article-layout { max-width: 820px; margin: 0 auto; }

    .article-masthead { text-align: center; margin-bottom: 28px; opacity: 0; animation: articleFadeUp .6s var(--ease-out) forwards; }
    .article-badges { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .chip-gold { background: var(--color-gold-soft); color: var(--color-gold-dark); display: inline-flex; align-items: center; gap: 5px; }

    .article-title {
      font-family: var(--font-display, var(--font-heading));
      font-size: clamp(1.7rem, 3.6vw, 2.5rem); font-weight: 800; letter-spacing: -.01em;
      line-height: 1.3; color: var(--color-text); margin: 0 0 18px;
    }

    .article-byline { display: flex; justify-content: center; flex-wrap: wrap; align-items: center; gap: 8px; }
    .byline-item { display: inline-flex; align-items: center; gap: 6px; font-size: .86rem; font-weight: 600; color: var(--color-text-secondary); }
    .byline-sep { color: var(--color-border-strong); font-weight: 700; }

    .article-cover {
      margin: 0 0 28px; opacity: 0; animation: articleFadeUp .6s var(--ease-out) .12s forwards;
    }
    .article-cover img {
      display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover;
      border-radius: 20px; box-shadow: 0 16px 36px rgba(0,60,25,.16);
    }
    @keyframes articleFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .article-masthead, .article-cover { animation: none; opacity: 1; transform: none; } }

    .detail-card { background: #fff; border-radius: 20px; padding: 36px; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); }
    .article-body { margin-bottom: 24px; }

    .content { font-size: 1.08rem; line-height: 1.95; color: var(--color-text); }
    .content ::ng-deep p { margin: 0 0 1.2em; }
    .content ::ng-deep img { max-width: 100%; border-radius: var(--radius-md); }
    /* Drop-cap paragraf pertama — penanda editorial yang Galeri sama sekali
       tidak punya (dokumentasi kegiatan tidak butuh "huruf besar pembuka"),
       sinyal visual langsung "ini artikel" sejak kalimat pertama. */
    .content ::ng-deep p:first-of-type::first-letter {
      font-family: var(--font-display, var(--font-heading));
      font-size: 3.4em; font-weight: 800; float: left; line-height: .82;
      margin: 8px 10px 0 0; color: var(--color-primary-dark);
    }

    .article-credits {
      display: flex; flex-wrap: wrap; gap: 6px 20px; margin: 28px 0 0; padding-top: 20px;
      border-top: 1px solid var(--color-border);
      font-size: .82rem; color: var(--color-text-secondary);
    }
    .article-credits b { color: var(--color-text); font-weight: 700; }

    .back-link {
      display: inline-flex; align-items: center; gap: 8px; margin-top: 20px;
      font-size: .86rem; font-weight: 700; color: var(--color-primary-dark); text-decoration: none;
    }
    .back-link:hover { color: var(--color-primary); text-decoration: none; }

    /* ---------- Baca Juga — kartu ringkas, BUKAN di dalam .detail-card
       (kartu-dalam-kartu janggal karena tiap item sudah jadi kartu sendiri)
       — duduk bebas di atas kanvas section-blob-drift. ---------- */
    .related-section { margin-bottom: 24px; }
    .related-heading {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-size: 1.05rem; font-weight: 800; color: var(--color-text);
    }
    .related-heading app-icon { color: var(--color-primary); }

    .related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .related-card {
      display: flex; flex-direction: column; background: #fff; border-radius: 16px; overflow: hidden;
      border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); text-decoration: none; color: inherit;
      transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s cubic-bezier(.22,1,.36,1);
    }
    .related-media { position: relative; aspect-ratio: 16 / 10; background: var(--color-bg-alt); overflow: hidden; }
    .related-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
    .related-media-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-primary); background: var(--color-primary-soft); }
    .related-body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 6px; }
    .related-cat { font-size: .68rem; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; color: var(--color-primary-dark); }
    .related-title {
      margin: 0; font-size: .92rem; font-weight: 700; line-height: 1.4; color: var(--color-text);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .related-date { display: inline-flex; align-items: center; gap: 5px; font-size: .72rem; color: var(--color-muted); font-weight: 600; }

    @media (hover: hover) and (pointer: fine) {
      .related-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); text-decoration: none; }
      .related-card:hover .related-media img { transform: scale(1.06); }
    }

    @media (max-width: 640px) {
      .related-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 640px) {
      .detail-card { padding: 24px; }
      .article-title { text-align: left; }
      .article-badges, .article-byline { justify-content: flex-start; }
      .article-masthead { text-align: left; }
    }
  `],
})
export class NewsPublicDetailPage implements OnInit {
  repo = inject(NewsRepository);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  relatedNews = signal<News[]>([]);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.repo.loadPublicDetail(slug);
      this.loadRelated(slug);
    }
  }

  /** Dipanggil langsung lewat repo.publicList() (Observable mentah, BUKAN
   *  repo.loadPublic() signal-store) supaya tidak menimpa repo.loading()/
   *  repo.publicNews() milik halaman index — sama pola dengan sheet preview
   *  Galeri yang memanggil API langsung untuk data sampingan. Minta
   *  RELATED_COUNT+1 lalu buang slug yang sedang dibaca kalau ikut
   *  ke-fetch, supaya kartu yang tampil tetap genap RELATED_COUNT. */
  private loadRelated(currentSlug: string): void {
    this.repo.publicList({ page: 1, limit: RELATED_COUNT + 1, sort: '-publishedDate' }).subscribe({
      next: (res) => {
        this.relatedNews.set(res.data.filter((n) => n.newsSlug !== currentSlug).slice(0, RELATED_COUNT));
      },
      error: () => {},
    });
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  imgUrl = resolveImageUrl;
  thumbUrl = resolveThumbnailUrl;
}
