import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NewsRepository } from '../../repositories/news.repository';
import { IconComponent } from '../../../../shared/icon.component';
import { CommentSectionComponent } from '../../../comment/components/comment-section.component';
import { resolveImageUrl } from '../../../../core/utils/image-url';

/**
 * Public detail page for a single news article. Hero kustom (gradien gelap +
 * bingkai cover, BUKAN app-page-hero — pola sama seperti Galeri, cover berita
 * apa pun rasionya tidak boleh merusak tampilan hero), kanvas blob-drift
 * setelahnya identik Galeri/Struktur/Kontak/Berita-index.
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
        <!-- ---------- Hero Header — gradien gelap + tekstur, cover berita
             ditampilkan dalam bingkai kartu berukuran wajar (pola sama persis
             dengan Galeri) supaya rasio/kualitas foto apa pun tidak merusak
             tampilan hero-nya sendiri. ---------- -->
        <header class="hero-section">
          <div class="hero-texture" aria-hidden="true"></div>
          <div class="hero-glow" aria-hidden="true"></div>
          <div class="container hero-grid">
            <div class="hero-copy">
              <div class="hero-badges">
                <span class="hero-tag"><app-icon name="tags" [size]="13" /> {{ n.categoryName }}</span>
                @if (n.isFeatured) {
                  <span class="hero-tag hero-tag-featured"><app-icon name="star" [size]="13" /> Unggulan</span>
                }
              </div>

              <span class="hero-event-name">Berita FSLDK Indonesia</span>
              <h1 class="hero-title">{{ n.newsTitle }}</h1>

              <div class="hero-meta-row">
                <span class="hero-meta-item"><app-icon name="user-circle" [size]="14" /> {{ n.newsReporter || n.authorName }}</span>
                @if (n.publishedDate) {
                  <span class="hero-meta-item"><app-icon name="calendar-days" [size]="14" /> {{ n.publishedDate | date: 'd MMMM yyyy' }}</span>
                }
                <span class="hero-meta-item"><app-icon name="eye" [size]="14" /> {{ n.viewCount }} kali dibaca</span>
              </div>
            </div>

            <div class="hero-visual">
              <div class="hero-cover-frame">
                @if (n.newsImage) {
                  <img [src]="imgUrl(n.newsImage)" [alt]="n.newsTitle" class="hero-cover-img" />
                } @else {
                  <div class="hero-cover-fallback"><app-icon name="newspaper" [size]="40" /></div>
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
                <a routerLink="/berita" class="crumb-link"><app-icon name="newspaper" [size]="13" /> Berita</a>
                <app-icon name="chevron-right" [size]="11" class="crumb-sep" />
                <span class="crumb-current" aria-current="page">{{ n.newsTitle }}</span>
              </nav>

              <!-- ---------- Bento 2-kolom: artikel + kartu Ringkasan
                   berdampingan (pola sama seperti Galeri — "Tentang Kegiatan
                   + Ringkasan", bukan satu kartu raksasa memanjang ke
                   bawah). ---------- -->
              <div class="story-grid">
                <section class="detail-card story-card-content">
                  <div class="content" [innerHTML]="sanitizeHtml(n.newsContent)"></div>
                  <a routerLink="/berita" class="back-link mt-lg"><app-icon name="arrow-left" [size]="13" /> Kembali ke Berita</a>
                </section>

                <aside class="detail-card story-card-info">
                  <span class="eyebrow"><app-icon name="info-circle" [size]="13" /> Ringkasan</span>
                  <ul class="info-rows mt-sm">
                    <li class="info-row">
                      <span class="info-row-icon"><app-icon name="user-circle" [size]="14" /></span>
                      <span class="info-row-text"><b>Penulis</b>{{ n.newsReporter || n.authorName }}</span>
                    </li>
                    @if (n.newsEditor) {
                      <li class="info-row">
                        <span class="info-row-icon"><app-icon name="edit" [size]="14" /></span>
                        <span class="info-row-text"><b>Editor</b>{{ n.newsEditor }}</span>
                      </li>
                    }
                    @if (n.newsPublisher) {
                      <li class="info-row">
                        <span class="info-row-icon"><app-icon name="newspaper" [size]="14" /></span>
                        <span class="info-row-text"><b>Penerbit</b>{{ n.newsPublisher }}</span>
                      </li>
                    }
                    @if (n.publishedDate) {
                      <li class="info-row">
                        <span class="info-row-icon"><app-icon name="calendar-days" [size]="14" /></span>
                        <span class="info-row-text"><b>Dipublikasikan</b>{{ n.publishedDate | date: 'd MMMM y' }}</span>
                      </li>
                    }
                    <li class="info-row">
                      <span class="info-row-icon"><app-icon name="eye" [size]="14" /></span>
                      <span class="info-row-text"><b>Dibaca</b>{{ n.viewCount }} kali</span>
                    </li>
                  </ul>
                </aside>
              </div>

              <section class="detail-card story-card-comments">
                <app-comment-section contentType="news" [contentID]="n.newsID" />
              </section>
            </div>
          </div>
        </main>
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

    /* Latar gradasi + tekstur titik — pola sama dengan app-page-hero /
       Galeri detail (disalin di sini karena view encapsulation). Cover
       berita apa pun kualitasnya tidak bisa merusak tampilan hero. */
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

    .hero-grid {
      position: relative; z-index: 2;
      display: grid; grid-template-columns: 1.15fr 1fr; gap: 40px; align-items: center;
    }
    .hero-copy { position: relative; z-index: 2; }

    .hero-badges { display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 10px; margin-bottom: 16px; }
    .hero-tag {
      background: rgba(255,255,255,.15); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,.25); color: #fff;
      font-size: .8rem; font-weight: 700; padding: 5px 12px; border-radius: 999px;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .hero-tag-featured { background: linear-gradient(135deg, var(--color-gold), var(--color-gold-dark)); border-color: rgba(255,255,255,.3); }

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

    /* ---------- Kanvas konten — identik .section-blob-drift Galeri/Struktur/
       Kontak/Berita-index (tint hijau + dua blob melayang pelan). ---------- */
    .detail-main-section {
      position: relative; overflow: hidden; padding: 48px 0 80px;
      background: var(--color-primary-tint);
    }
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

    .detail-card { background: #fff; border-radius: 20px; padding: 32px; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); }

    .content { font-size: 1.06rem; line-height: 1.9; color: var(--color-text); }
    .content ::ng-deep p { margin: 0 0 1.2em; }
    .content ::ng-deep img { max-width: 100%; border-radius: var(--radius-md); }

    .back-link {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: .86rem; font-weight: 700; color: var(--color-primary-dark); text-decoration: none;
    }
    .back-link:hover { color: var(--color-primary); text-decoration: none; }

    .info-rows { display: flex; flex-direction: column; gap: 14px; list-style: none; margin: 0; padding: 0; }
    .info-row { display: flex; align-items: center; gap: 12px; }
    .info-row-icon {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 32px; height: 32px; border-radius: 10px;
      background: var(--color-primary-soft); color: var(--color-primary-dark);
    }
    .info-row-text { display: flex; flex-direction: column; gap: 1px; font-size: .86rem; color: var(--color-text); }
    .info-row-text b { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); }
  `],
})
export class NewsPublicDetailPage implements OnInit {
  repo = inject(NewsRepository);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) this.repo.loadPublicDetail(slug);
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  imgUrl = resolveImageUrl;
}
