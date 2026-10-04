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
 * Public detail page for a single news article — konsep "hero foto
 * full-bleed + kartu mengambang", SENGAJA BEDA dari Galeri (foto kecil
 * dibingkai matte di samping hero gelap solid + bento sidebar "Ringkasan"):
 * di sini cover MENJADI background hero penuh lebar (judul & kategori
 * mengambang di atasnya, scrim gradasi di bawah), lalu kartu artikel
 * "mengambang" naik menimpa tepi bawah foto (floating overlap card) —
 * trik editorial klasik yang memberi kedalaman & irama, bukan sekadar
 * tumpukan blok rata.
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
        <!-- ---------- Hero foto full-bleed — cover JADI background hero
             (bukan dibingkai kecil di samping seperti Galeri). Tanpa foto,
             jatuh ke gradien bertekstur bermerk (bahasa sama app-page-hero)
             supaya tidak pernah jadi kotak kosong. ---------- -->
        <header class="article-hero" [class.has-image]="!!n.newsImage">
          @if (n.newsImage) {
            <img [src]="imgUrl(n.newsImage)" [alt]="n.newsTitle" class="article-hero-bg" />
          }
          <div class="article-hero-texture" aria-hidden="true"></div>
          <div class="article-hero-scrim" aria-hidden="true"></div>
          <div class="container article-hero-inner">
            <nav class="crumb-row crumb-row-light" aria-label="Breadcrumb">
              <a routerLink="/" class="crumb-link"><app-icon name="home" [size]="13" /> Beranda</a>
              <app-icon name="chevron-right" [size]="11" class="crumb-sep" />
              <a routerLink="/berita" class="crumb-link"><app-icon name="newspaper" [size]="13" /> Berita</a>
            </nav>
            <div class="article-badges">
              <span class="chip chip-green">{{ n.categoryName }}</span>
              @if (n.isFeatured) {
                <span class="chip chip-gold"><app-icon name="star" [size]="11" /> Unggulan</span>
              }
            </div>
            <h1 class="article-hero-title">{{ n.newsTitle }}</h1>
          </div>
        </header>

        <section class="section section-blob-drift">
          <div class="container pb-xl">
            <div class="article-layout">
              <!-- ---------- Kartu artikel mengambang — margin-top negatif
                   menarik kartu ini naik menimpa tepi bawah foto hero,
                   strip meta (icon-badge) jadi "jahitan" yang menyatukan
                   foto & teks, drop-cap di paragraf pertama. ---------- -->
              <article class="detail-card article-body">
                <div class="article-meta-strip">
                  <span class="meta-pill">
                    <span class="icon-badge sm icon-badge-solid"><app-icon name="user-circle" [size]="14" /></span>
                    {{ n.newsReporter || n.authorName }}
                  </span>
                  @if (n.publishedDate) {
                    <span class="meta-pill">
                      <span class="icon-badge sm icon-badge-gold"><app-icon name="calendar-days" [size]="14" /></span>
                      {{ n.publishedDate | date: 'd MMMM yyyy' }}
                    </span>
                  }
                  <span class="meta-pill">
                    <span class="icon-badge sm icon-badge-ember"><app-icon name="eye" [size]="14" /></span>
                    {{ n.viewCount }} kali dibaca
                  </span>
                </div>

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
    }
    .crumb-link { display: inline-flex; align-items: center; gap: 5px; color: var(--color-text-secondary); text-decoration: none; transition: color var(--motion-fast) ease; }
    .crumb-link:hover { color: var(--color-primary-dark); text-decoration: none; }
    .crumb-sep { color: var(--color-border-strong); flex-shrink: 0; }
    /* Varian breadcrumb terang — dipakai DI DALAM hero foto (duduk di atas
       scrim gelap), beda dari .crumb-row biasa yang didesain untuk latar
       terang (tidak dipakai lagi di halaman ini, hero sudah menyatukan
       breadcrumb+judul). */
    .crumb-row-light { margin-bottom: 18px; }
    .crumb-row-light .crumb-link { color: rgba(255,255,255,.82); }
    .crumb-row-light .crumb-link:hover { color: #fff; }
    .crumb-row-light .crumb-sep { color: rgba(255,255,255,.4); }

    /* ---------- Hero foto full-bleed — cover JADI background (bukan
       dibingkai kecil di samping ala Galeri). Tanpa foto, jatuh ke gradien
       bertekstur bermerk (persis bahasa app-page-hero) supaya tidak pernah
       jadi kotak kosong. Tinggi dibuat generus (min-height) supaya terasa
       sebagai hero sungguhan, bukan banner tipis. ---------- */
    .article-hero {
      position: relative; overflow: hidden;
      min-height: 460px; display: flex; flex-direction: column; justify-content: flex-end;
      padding: 90px 0 120px;
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 62%, var(--color-primary-darker) 100%);
    }
    /* Foto apa pun isinya (sertifikat, screenshot, foto rapat — bukan foto
       studio yang dikurasi) digelapkan LEBIH DULU lewat filter sebelum scrim
       gradasi ditumpuk di atasnya. Dilaporkan: judul & breadcrumb putih
       tidak terbaca menimpa foto terang/ramai (mis. sertifikat putih penuh
       teks) karena scrim lama cuma kuat di 40% bawah — filter brightness di
       SELURUH foto ini yang menjamin kontras di mana pun teks jatuh,
       berapa pun panjang judulnya (2-3 baris mendorong blok teks naik
       melewati zona scrim terkuat). */
    .article-hero-bg {
      position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;
      filter: brightness(.5) saturate(.85);
    }
    .article-hero-texture {
      position: absolute; inset: 0; z-index: 0; opacity: .5; pointer-events: none;
      background-image: radial-gradient(circle, rgba(255,255,255,.5) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 15% -10px;
      mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
    }
    /* Hanya tampil kalau TIDAK ada foto (tekstur dotted di atas foto asli
       akan terlihat kotor) — foto sungguhan sudah digelapkan sendiri. */
    .article-hero.has-image .article-hero-texture { display: none; }
    .article-hero-scrim {
      position: absolute; inset: 0; z-index: 1; pointer-events: none;
      background: linear-gradient(to top, rgba(6,14,10,.6) 0%, rgba(6,14,10,.25) 55%, transparent 100%);
    }
    /* Wash hijau brand DI SELURUH foto (bukan cuma gradasi dari bawah) +
       scrim gelap yang jauh lebih tinggi cakupannya — breadcrumb di PALING
       ATAS hero pun tetap di atas lapisan gelap, bukan foto polos. */
    .article-hero.has-image .article-hero-scrim {
      background:
        linear-gradient(160deg, rgba(4,100,40,.32) 0%, rgba(3,55,26,.58) 100%),
        linear-gradient(to top, rgba(4,20,12,.78) 0%, rgba(4,20,12,.42) 55%, rgba(4,20,12,.12) 100%);
    }

    .article-hero-inner { position: relative; z-index: 2; max-width: 820px; }
    .article-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .chip-gold { background: var(--color-gold-soft); color: var(--color-gold-dark); display: inline-flex; align-items: center; gap: 5px; }

    .article-hero-title {
      font-family: var(--font-display, var(--font-heading));
      font-size: clamp(1.7rem, 3.6vw, 2.6rem); font-weight: 800; letter-spacing: -.01em;
      line-height: 1.28; color: #fff; margin: 0; text-shadow: 0 2px 14px rgba(0,0,0,.4);
    }

    .crumb-row-light, .article-badges, .article-hero-title { opacity: 0; animation: heroCopyFadeUp .7s var(--ease-out) forwards; }
    .crumb-row-light { animation-delay: .05s; }
    .article-badges { animation-delay: .15s; }
    .article-hero-title { animation-delay: .25s; }
    @keyframes heroCopyFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 640px) {
      .article-hero { min-height: 340px; padding: 64px 0 90px; }
    }

    /* ---------- Kanvas setelah hero — identik .section-blob-drift Galeri/
       Struktur/Kontak/Berita-index. TANPA .section-transition (yang
       didesain untuk hero bergelombang ala app-page-hero) — hero foto ini
       bertepi datar, iramanya datang dari kartu yang menimpanya, bukan dari
       padding ekstra di sini. ---------- */
    .section { background: var(--color-primary-tint); position: relative; }
    .section-blob-drift { overflow: hidden; }
    .section-blob-drift > .container { position: relative; z-index: 1; }
    .section-blob-drift::before {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 55% 55% at 88% 42%, var(--color-gold-soft) 0%, var(--color-primary-soft) 42%, transparent 75%),
        radial-gradient(ellipse 50% 50% at 10% 62%, var(--color-primary-soft) 0%, var(--color-gold-soft) 45%, transparent 75%);
      opacity: .8; animation: sectionBlobDrift 12s ease-in-out infinite alternate;
    }
    @keyframes sectionBlobDrift {
      from { transform: translate(0, 0) scale(1); }
      to { transform: translate(-4%, 5%) scale(1.15); }
    }
    @media (prefers-reduced-motion: reduce) { .section-blob-drift::before { animation: none; } }

    /* ---------- Kolom baca sempit — 820px, BUKAN 1080px bento lebar ala
       Galeri. ---------- */
    .article-layout { max-width: 820px; margin: 0 auto; }

    .detail-card { background: #fff; border-radius: 22px; padding: 36px; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); }
    /* Kartu "mengambang" naik menimpa tepi bawah hero — trik kedalaman
       editorial, dan sumber utama irama halaman (bukan sekadar blok rata
       berurutan). Shadow dinaikkan supaya kesan "terangkat dari foto"
       terbaca jelas, bukan cuma shadow standar .detail-card. */
    .article-body {
      position: relative; z-index: 3; margin-top: -72px; margin-bottom: 24px;
      box-shadow: 0 -4px 0 rgba(0,0,0,0), 0 28px 56px rgba(0,30,15,.22);
    }

    .article-meta-strip {
      display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 24px; padding-bottom: 20px;
      border-bottom: 1px solid var(--color-border);
    }
    .meta-pill { display: inline-flex; align-items: center; gap: 10px; font-size: .86rem; font-weight: 600; color: var(--color-text-secondary); }

    .content { font-size: 1.08rem; line-height: 1.95; color: var(--color-text); }
    .content ::ng-deep p { margin: 0 0 1.2em; }
    .content ::ng-deep img { max-width: 100%; border-radius: var(--radius-md); }
    /* Drop-cap paragraf pertama — penanda editorial yang Galeri sama sekali
       tidak punya (dokumentasi kegiatan tidak butuh "huruf besar pembuka"). */
    .content ::ng-deep p:first-of-type::first-letter {
      font-family: var(--font-display, var(--font-heading));
      font-size: 3.4em; font-weight: 800; float: left; line-height: .82;
      margin: 8px 10px 0 0; color: var(--color-primary-dark);
    }
    /* Pull-quote — kalau editor CMS menyisipkan blockquote, tampil sebagai
       kutipan besar bergaya, bukan teks biasa berindentasi. */
    .content ::ng-deep blockquote {
      margin: 28px 0; padding: 2px 0 2px 24px; border-left: 4px solid var(--color-gold);
      font-family: var(--font-accent, var(--font-heading)); font-style: italic;
      font-size: 1.25rem; line-height: 1.6; color: var(--color-primary-dark);
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
      .article-body { margin-top: -48px; }
      .article-meta-strip { gap: 14px; }
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
