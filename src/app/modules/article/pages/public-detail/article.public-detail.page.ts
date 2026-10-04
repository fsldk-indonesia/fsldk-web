import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ArticleRepository } from '../../repositories/article.repository';
import { Article } from '../../entities/article';
import { IconComponent } from '../../../../shared/icon.component';
import { CommentSectionComponent } from '../../../comment/components/comment-section.component';
import { resolveImageUrl, resolveThumbnailUrl } from '../../../../core/utils/image-url';

/** Jumlah kartu "Baca Juga" yang ditampilkan — diminta 1 lebih dari ini ke
 *  API supaya tetap ada cadangan kalau artikel yang sedang dibaca kebetulan
 *  ikut ke-fetch (lihat loadRelated()). */
const RELATED_COUNT = 3;

/** Estimasi waktu baca (menit) dari jumlah kata articleIntro, ~200 kata/menit. */
function readingMinutes(html: string | null | undefined): number {
  if (!html) return 1;
  const words = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Public detail page for a single article — pola sama persis dengan Berita/
 * Galeri detail (hero gelap + cover dalam bingkai matte object-fit:contain
 * di kolom kanan, bento 2-kolom "Isi Artikel" + sidebar "Ringkasan"+"Baca
 * Juga" di bawahnya), plus kartu khusus CTA PDF (naskah lengkap) & komentar.
 */
@Component({
  selector: 'app-article-public-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe, IconComponent, CommentSectionComponent],
  template: `
    @if (repo.loading()) {
      <div class="empty-state py-xl">
        <div class="spinner"></div>
        <p class="mt-sm text-muted">Memuat artikel...</p>
      </div>
    } @else if (repo.error()) {
      <div class="container py-xl text-center">
        <div class="empty-icon text-danger"><app-icon name="alert-triangle" [size]="48" /></div>
        <h3>Terjadi Kesalahan</h3>
        <p class="text-muted">{{ repo.error() }}</p>
        <a routerLink="/artikel" class="btn btn-outline mt-md">Kembali ke Artikel</a>
      </div>
    } @else {
      @if (repo.currentArticle(); as a) {
        <header class="hero-section">
          <div class="hero-texture" aria-hidden="true"></div>
          <div class="hero-glow" aria-hidden="true"></div>
          <div class="container hero-grid">
            <div class="hero-copy">
              <div class="hero-badges">
                <span class="hero-tag"><app-icon name="tags" [size]="13" /> {{ a.categoryName }}</span>
                @if (a.articlePdf) {
                  <span class="hero-tag hero-tag-pdf"><app-icon name="file-text" [size]="13" /> PDF Tersedia</span>
                }
              </div>

              <span class="hero-event-name">Artikel &amp; Kajian FSLDK Indonesia</span>
              <h1 class="hero-title">{{ a.articleTitle }}</h1>

              <div class="hero-meta-row">
                <span class="hero-meta-item"><app-icon name="user-circle" [size]="14" /> {{ a.articleWriter || a.authorName }}</span>
                @if (a.publishedDate) {
                  <span class="hero-meta-item"><app-icon name="calendar-days" [size]="14" /> {{ a.publishedDate | date: 'd MMMM yyyy' }}</span>
                }
                <span class="hero-meta-item"><app-icon name="clock" [size]="14" /> {{ readingTime(a.articleIntro) }} menit baca</span>
              </div>
            </div>

            <div class="hero-visual">
              <div class="hero-cover-frame">
                @if (a.articleImage) {
                  <img [src]="imgUrl(a.articleImage)" [alt]="a.articleTitle" class="hero-cover-img" />
                } @else {
                  <div class="hero-cover-fallback"><app-icon name="book-open" [size]="40" /></div>
                }
              </div>
            </div>
          </div>
        </header>

        <main class="detail-main-section">
          <div class="container">
            <div class="content-layout">
              <nav class="crumb-row" aria-label="Breadcrumb">
                <a routerLink="/" class="crumb-link"><app-icon name="home" [size]="13" /> Beranda</a>
                <app-icon name="chevron-right" [size]="11" class="crumb-sep" />
                <a routerLink="/artikel" class="crumb-link"><app-icon name="book-open" [size]="13" /> Artikel</a>
                <app-icon name="chevron-right" [size]="11" class="crumb-sep" />
                <span class="crumb-current" aria-current="page">{{ a.articleTitle }}</span>
              </nav>

              <div class="story-grid">
                <section class="detail-card story-card-content">
                  <span class="eyebrow"><app-icon name="info-circle" [size]="13" /> Isi Artikel</span>
                  <div class="story-lead-text mt-sm content" [innerHTML]="sanitizeHtml(a.articleIntro)"></div>

                  @if (a.articleEditor) {
                    <div class="article-credits">
                      <span><b>Editor:</b> {{ a.articleEditor }}</span>
                    </div>
                  }

                  <!-- ---------- CTA naskah lengkap — tombol di "Isi Artikel"
                       (bukan link teks di sidebar Ringkasan), pola sama persis
                       dengan tombol "Baca Buku (PDF)" Perpustakaan
                       (catalogbook.public-detail.page.ts .actions-row/.action-btn). ---------- -->
                  <div class="actions-row">
                    @if (a.articlePdf) {
                      <a [href]="a.articlePdf" target="_blank" rel="noopener noreferrer" class="action-btn action-btn-primary">
                        <app-icon name="file-text" [size]="15" /> Baca Naskah Lengkap (PDF)
                      </a>
                    } @else {
                      <span class="action-pdf-missing"><app-icon name="info-circle" [size]="13" /> Berkas PDF lengkap belum tersedia untuk artikel ini.</span>
                    }
                  </div>
                </section>

                <div class="story-sidebar">
                  <aside class="detail-card story-card-info">
                    <span class="eyebrow"><app-icon name="sparkles" [size]="13" /> Ringkasan</span>
                    <ul class="info-rows mt-sm">
                      <li class="info-row">
                        <span class="info-row-icon"><app-icon name="user-circle" [size]="14" /></span>
                        <span class="info-row-text"><b>Penulis</b>{{ a.articleWriter || a.authorName }}</span>
                      </li>
                      <li class="info-row">
                        <span class="info-row-icon"><app-icon name="tags" [size]="14" /></span>
                        <span class="info-row-text"><b>Kategori</b>{{ a.categoryName }}</span>
                      </li>
                      @if (a.publishedDate) {
                        <li class="info-row">
                          <span class="info-row-icon"><app-icon name="calendar-days" [size]="14" /></span>
                          <span class="info-row-text"><b>Dipublikasikan</b>{{ a.publishedDate | date: 'd MMMM y' }}</span>
                        </li>
                      }
                    </ul>

                    <a routerLink="/artikel" class="info-cta"><app-icon name="arrow-left" [size]="13" /> Kembali ke Artikel</a>
                  </aside>

                  <!-- ---------- Baca Juga — artikel lain selain yang sedang
                       dibaca. Dipanggil langsung lewat repo.publicList()
                       (Observable mentah, BUKAN repo.loadPublic() signal-store)
                       supaya tidak menimpa repo.loading()/repo.publicArticles()
                       milik halaman index — pola sama persis Berita. ---------- -->
                  @if (relatedArticles().length > 0) {
                    <aside class="detail-card story-card-related">
                      <span class="eyebrow"><app-icon name="book-open" [size]="13" /> Baca Juga</span>
                      <div class="related-list mt-sm">
                        @for (item of relatedArticles(); track item.articleID) {
                          <a [routerLink]="['/artikel', item.articleSlug]" class="related-item">
                            <div class="related-item-media">
                              @if (item.articleImage) {
                                <img [src]="thumbUrl(item.articleImage)" [alt]="item.articleTitle" loading="lazy" />
                              } @else {
                                <div class="related-item-media-fallback"><app-icon name="book-open" [size]="16" /></div>
                              }
                            </div>
                            <div class="related-item-body">
                              <h3 class="related-item-title">{{ item.articleTitle }}</h3>
                              @if (item.publishedDate) {
                                <span class="related-item-date">{{ item.publishedDate | date: 'd MMM y' }}</span>
                              }
                            </div>
                          </a>
                        }
                      </div>
                    </aside>
                  }
                </div>
              </div>

              <section class="detail-card story-card-comments">
                <app-comment-section contentType="article" [contentID]="a.articleID" />
              </section>
            </div>
          </div>
        </main>
      } @else {
        <div class="container py-xl text-center">
          <h2>Artikel tidak ditemukan</h2>
          <a routerLink="/artikel" class="btn btn-primary mt">Kembali ke Artikel</a>
        </div>
      }
    }
  `,
  styles: [`
    .crumb-row {
      display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
      font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary);
      margin-bottom: 20px;
    }
    .crumb-link { display: inline-flex; align-items: center; gap: 5px; color: var(--color-text-secondary); text-decoration: none; transition: color var(--motion-fast) ease; }
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

    /* Latar gradasi + tekstur titik — pola sama dengan app-page-hero/Berita/
       Galeri detail. Cover artikel apa pun kualitasnya tidak bisa merusak
       tampilan hero (object-fit:contain dalam bingkai, bukan latar penuh-layar). */
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

    .hero-grid { position: relative; z-index: 2; display: grid; grid-template-columns: 1.15fr 1fr; gap: 40px; align-items: center; }
    .hero-copy { position: relative; z-index: 2; }

    .hero-badges { display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 10px; margin-bottom: 16px; }
    .hero-tag {
      background: rgba(255,255,255,.15); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,.25); color: #fff;
      font-size: .8rem; font-weight: 700; padding: 5px 12px; border-radius: 999px;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .hero-tag-pdf { background: linear-gradient(135deg, var(--color-gold), var(--color-gold-dark)); border-color: rgba(255,255,255,.3); }

    .hero-event-name { display: block; font-size: 1.1rem; font-weight: 700; color: var(--color-primary-soft); letter-spacing: .03em; margin-bottom: 8px; }
    .hero-title { font-size: 2.3rem; font-weight: 900; font-family: var(--font-heading); line-height: 1.3; color: #fff; margin: 0 0 20px; text-shadow: 0 2px 10px rgba(0,0,0,.4); }

    .hero-meta-row { display: flex; flex-wrap: wrap; gap: 16px; }
    .hero-meta-item { display: inline-flex; align-items: center; gap: 6px; font-size: .86rem; font-weight: 600; color: rgba(255,255,255,.88); }

    .hero-badges, .hero-event-name, .hero-title, .hero-meta-row { opacity: 0; animation: heroCopyFadeUp .7s var(--ease-out) forwards; }
    .hero-badges { animation-delay: .05s; }
    .hero-event-name { animation-delay: .15s; }
    .hero-title { animation-delay: .25s; }
    .hero-meta-row { animation-delay: .4s; }
    @keyframes heroCopyFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

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
    .hero-cover-img { display: block; max-width: 100%; max-height: 380px; width: auto; height: auto; object-fit: contain; border-radius: 5%; }
    .hero-cover-fallback { width: 100%; height: 220px; border-radius: 5%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.06); color: rgba(255,255,255,.6); }

    @media (max-width: 900px) {
      .hero-grid { grid-template-columns: 1fr; gap: 28px; }
      .hero-copy { text-align: center; }
      .hero-badges, .hero-meta-row { justify-content: center; }
      .hero-visual { order: -1; }
      .hero-cover-frame { max-width: 340px; }
    }

    /* ---------- Kanvas konten — identik .section-blob-drift Galeri/
       Struktur/Kontak/Berita detail. ---------- */
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
    @keyframes detailBlobDrift {
      from { transform: translate(0, 0) scale(1); }
      to { transform: translate(-4%, 5%) scale(1.15); }
    }
    @media (prefers-reduced-motion: reduce) { .detail-main-section::before { animation: none; } }

    .content-layout { max-width: 1080px; margin: 0 auto; }

    .story-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 24px; margin-bottom: 24px; }
    .story-grid > * { min-width: 0; }
    @media (max-width: 860px) { .story-grid { grid-template-columns: 1fr; } }

    .detail-card { background: #fff; border-radius: 20px; padding: 32px; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); margin-bottom: 24px; }
    .story-grid .detail-card { margin-bottom: 0; }

    .story-sidebar { display: flex; flex-direction: column; gap: 24px; }

    .story-lead-text { font-size: 1.04rem; line-height: 1.9; color: var(--color-text-secondary); }
    .content ::ng-deep p { margin: 0 0 1.2em; }
    .content ::ng-deep img { max-width: 100%; border-radius: var(--radius-md); }

    .article-credits {
      display: flex; flex-wrap: wrap; gap: 6px 20px; margin: 24px 0 0; padding-top: 18px;
      border-top: 1px solid var(--color-border);
      font-size: .82rem; color: var(--color-text-secondary);
    }
    .article-credits b { color: var(--color-text); font-weight: 700; }

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

    /* ---------- CTA naskah lengkap di "Isi Artikel" — disalin dari pola
       tombol "Baca Buku (PDF)" Perpustakaan (catalogbook.public-detail.page.ts
       .actions-row/.action-btn), supaya bahasa CTA konsisten lintas modul. ---------- */
    .actions-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--color-border); }
    .action-btn { display: inline-flex; align-items: center; gap: 8px; height: 46px; padding: 0 22px; border-radius: var(--radius-full); font-weight: 700; font-size: .88rem; cursor: pointer; transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease; text-decoration: none; }
    .action-btn-primary { border: none; color: #fff; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); box-shadow: 0 8px 22px color-mix(in srgb, var(--color-primary) 38%, transparent); }
    .action-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px color-mix(in srgb, var(--color-primary) 44%, transparent); color: #fff; }
    .action-pdf-missing { display: inline-flex; align-items: center; gap: 6px; color: var(--color-muted); font-size: .86rem; font-style: italic; }

    .related-list { display: flex; flex-direction: column; gap: 14px; }
    .related-item {
      display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit;
      padding: 6px; margin: -6px; border-radius: 12px;
      transition: background var(--motion-fast) ease;
    }
    .related-item:hover { background: var(--color-bg-alt); text-decoration: none; }
    .related-item-media {
      position: relative; flex-shrink: 0; width: 56px; height: 56px; border-radius: 10px; overflow: hidden;
      background: var(--color-bg-alt);
    }
    .related-item-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .related-item-media-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-primary); background: var(--color-primary-soft); }
    .related-item-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .related-item-title {
      margin: 0; font-size: .86rem; font-weight: 700; line-height: 1.35; color: var(--color-text);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .related-item-date { font-size: .72rem; color: var(--color-muted); font-weight: 600; }
  `],
})
export class ArticlePublicDetailPage implements OnInit {
  repo = inject(ArticleRepository);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  relatedArticles = signal<Article[]>([]);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.repo.loadPublicDetail(slug);
      this.loadRelated(slug);
    }
  }

  /** Dipanggil langsung lewat repo.publicList() (Observable mentah, BUKAN
   *  repo.loadPublic() signal-store) supaya tidak menimpa repo.loading()/
   *  repo.publicArticles() milik halaman index — sama pola dengan Berita. */
  private loadRelated(currentSlug: string): void {
    this.repo.publicList({ page: 1, limit: RELATED_COUNT + 1, sort: '-publishedDate' }).subscribe({
      next: (res) => {
        this.relatedArticles.set(res.data.filter((a) => a.articleSlug !== currentSlug).slice(0, RELATED_COUNT));
      },
      error: () => {},
    });
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  readingTime = readingMinutes;
  imgUrl = resolveImageUrl;
  thumbUrl = resolveThumbnailUrl;
}
