import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { Goods, GoodsDetail } from '../../entities/goods';
import { goodsPath } from '../../goods.path';
import { IconComponent } from '../../../../shared/icon.component';
import { ImageGalleryComponent } from '../../../../shared/image-gallery.component';
import { GoodsRepository } from '../../repositories/goods.repository';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { GoodsPublicDetailPresenter } from './goods.public-detail.presenter';
import { GoodsPublicDetailView } from './goods.public-detail.view';

/** Jumlah kartu "Produk Lainnya" yang ditampilkan — diminta 1 lebih dari ini
 *  ke API supaya tetap ada cadangan kalau produk yang sedang dilihat
 *  kebetulan ikut ke-fetch (lihat loadRelated()), pola sama persis Berita/
 *  Artikel. */
const RELATED_COUNT = 4;

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Tersedia',
  out_of_stock: 'Stok Habis',
  coming_soon: 'Segera Hadir',
};

// Warna badge ketersediaan reuse token semantik existing (.badge-published
// hijau, .badge-danger merah, .badge-info biru) — bukan warna baru.
const AVAILABILITY_BADGE_CLASS: Record<string, string> = {
  available: 'badge-published',
  out_of_stock: 'badge-danger',
  coming_soon: 'badge-info',
};

/**
 * Halaman detail publik FSLDK Goods — pola sama persis dengan Berita/Galeri/
 * Artikel detail (hero gelap diagonal + foto dalam bingkai matte di kolom
 * kanan, breadcrumb, bento 2-kolom "Deskripsi Produk" + sidebar "Info
 * Produk"+"Produk Lainnya" di bawahnya). CTA beli tetap di kartu konten utama
 * (actions-row/action-btn, pola sama dengan "Baca Buku (PDF)" Perpustakaan /
 * "Baca Naskah Lengkap" Artikel) — bukan lagi tombol lebar penuh terpisah di
 * luar kartu seperti versi lama.
 */
@Component({
  selector: 'app-goods-public-detail-page',
  standalone: true,
  templateUrl: './goods.public-detail.page.html',
  imports: [RouterLink, NgClass, IconComponent, ImageGalleryComponent],
  providers: [GoodsPublicDetailPresenter],
  styles: [`
    /* Latar gradasi + tekstur titik — pola sama dengan app-page-hero/Berita/
       Galeri/Artikel detail. Foto produk apa pun rasionya tidak bisa merusak
       tampilan hero (app-image-gallery dalam bingkai matte, bukan latar
       penuh-layar). */
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
    .hero-tag-gold { background: linear-gradient(135deg, var(--color-gold), var(--color-gold-dark)); border-color: rgba(255,255,255,.3); }
    .hero-tag-unavailable { background: rgba(0,0,0,.35); }

    .hero-event-name { display: block; font-size: 1.1rem; font-weight: 700; color: var(--color-primary-soft); letter-spacing: .03em; margin-bottom: 8px; }
    .hero-title { font-size: 2.3rem; font-weight: 900; font-family: var(--font-heading); line-height: 1.25; color: #fff; margin: 0 0 16px; text-shadow: 0 2px 10px rgba(0,0,0,.4); }
    .hero-price { font-size: 1.7rem; font-weight: 800; color: #fff; margin: 0 0 14px; }

    .hero-meta-row { display: flex; flex-wrap: wrap; gap: 16px; }
    .hero-meta-item { display: inline-flex; align-items: center; gap: 6px; font-size: .86rem; font-weight: 600; color: rgba(255,255,255,.88); }
    .hero-meta-item code { font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; background: rgba(255,255,255,.15); padding: 1px 7px; border-radius: 6px; font-size: .8rem; }

    .hero-badges, .hero-event-name, .hero-title, .hero-price, .hero-meta-row { opacity: 0; animation: heroCopyFadeUp .7s var(--ease-out) forwards; }
    .hero-badges { animation-delay: .05s; }
    .hero-event-name { animation-delay: .15s; }
    .hero-title { animation-delay: .25s; }
    .hero-price { animation-delay: .32s; }
    .hero-meta-row { animation-delay: .4s; }
    @keyframes heroCopyFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

    .hero-visual { position: relative; z-index: 2; }
    .hero-cover-frame {
      position: relative; width: 100%; max-width: 420px; margin: 0 auto;
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.25);
      border-radius: 18px; padding: 14px; box-sizing: border-box;
      box-shadow: 0 24px 50px rgba(0,0,0,.35);
      opacity: 0; animation: heroCoverIn .7s var(--ease-out) .3s forwards;
    }
    @keyframes heroCoverIn { from { opacity: 0; transform: scale(.92) translateY(10px); } to { opacity: 1; transform: none; } }

    @media (max-width: 900px) {
      .hero-grid { grid-template-columns: 1fr; gap: 28px; }
      .hero-copy { text-align: center; }
      .hero-badges, .hero-meta-row { justify-content: center; }
      .hero-visual { order: -1; }
      .hero-cover-frame { max-width: 340px; }
    }

    /* ---------- Kanvas konten — identik .section-blob-drift Galeri/
       Struktur/Kontak/Berita/Artikel detail. ---------- */
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

    .story-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 24px; margin-bottom: 24px; }
    .story-grid > * { min-width: 0; }
    @media (max-width: 860px) { .story-grid { grid-template-columns: 1fr; } }

    .detail-card { background: #fff; border-radius: 20px; padding: 32px; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); margin-bottom: 24px; }
    .story-grid .detail-card { margin-bottom: 0; }

    .story-sidebar { display: flex; flex-direction: column; gap: 24px; }

    .story-lead-text { font-size: 1.04rem; line-height: 1.8; color: var(--color-text-secondary); margin: 0; }

    .actions-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--color-border); }
    .action-btn { display: inline-flex; align-items: center; gap: 8px; height: 48px; padding: 0 24px; border-radius: var(--radius-full); font-weight: 700; font-size: .92rem; cursor: pointer; transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease; text-decoration: none; border: none; }
    .action-btn-primary { color: #fff; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); box-shadow: 0 8px 22px color-mix(in srgb, var(--color-primary) 38%, transparent); }
    .action-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px color-mix(in srgb, var(--color-primary) 44%, transparent); color: #fff; }
    .action-btn-disabled { color: var(--color-muted); background: var(--color-bg-alt); cursor: not-allowed; }
    .purchase-hint { flex-basis: 100%; margin: 0; font-size: .82rem; color: var(--color-muted); }

    .description { margin-top: 32px; padding-top: 28px; border-top: 1px solid var(--color-border); }
    .description h2 { font-size: 1.1rem; margin: 0 0 14px; }
    .prose { font-size: 1rem; line-height: 1.8; color: var(--color-text); max-width: 68ch; }
    .prose :is(p, ul, ol) { margin: 0 0 1em; }
    .prose :is(ul, ol) { padding-left: 1.3em; }
    .prose img { max-width: 100%; border-radius: var(--radius-sm); }
    .prose :last-child { margin-bottom: 0; }

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

    .related-list { display: flex; flex-direction: column; gap: 14px; }
    .related-item {
      display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit;
      padding: 6px; margin: -6px; border-radius: 12px;
      transition: background var(--motion-fast) ease;
    }
    .related-item:hover { background: var(--color-bg-alt); text-decoration: none; }
    .related-item-media {
      position: relative; flex-shrink: 0; width: 56px; height: 56px; border-radius: 10px; overflow: hidden;
      background: var(--color-primary-soft);
    }
    .related-item-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .related-item-media-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-primary); }
    .related-item-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .related-item-title {
      margin: 0; font-size: .86rem; font-weight: 700; line-height: 1.35; color: var(--color-text);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .related-item-price { font-size: .78rem; color: var(--color-primary-dark); font-weight: 700; }
  `],
})
export class GoodsPublicDetailPage implements OnInit, GoodsPublicDetailView {
  private presenter = inject(GoodsPublicDetailPresenter);
  private route = inject(ActivatedRoute);
  private goodsRepo = inject(GoodsRepository);
  private auth = inject(AuthRepository);

  item = signal<GoodsDetail | null>(null);
  loading = signal(true);
  relatedGoods = signal<Goods[]>([]);
  readonly formatRupiah = formatRupiah;
  readonly availabilityLabels = AVAILABILITY_LABELS;
  readonly availabilityBadgeClass = AVAILABILITY_BADGE_CLASS;
  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly goodsPath = goodsPath;

  galleryImages = computed(() => {
    const g = this.item();
    if (!g) return [];
    return [g.mainImageUrl, ...g.images].filter((url): url is string => !!url);
  });

  ngOnInit(): void {
    this.presenter.attachView(this);
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.presenter.load(slug);
  }

  /** Dipanggil langsung lewat goodsRepo.publicList() (Observable mentah,
   *  BUKAN lewat presenter/view) supaya tidak menimpa state loading/item
   *  milik produk utama — pola sama persis Berita/Artikel. */
  private loadRelated(categoryID: number, currentSlug: string): void {
    this.goodsRepo.publicList({ page: 1, limit: RELATED_COUNT + 1, categoryID, sort: 'newest' }).subscribe({
      next: (res) => this.relatedGoods.set(res.data.filter((g) => g.goodsSlug !== currentSlug).slice(0, RELATED_COUNT)),
      error: () => {},
    });
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setGoods(goods: GoodsDetail | null): void {
    this.item.set(goods);
    if (goods) this.loadRelated(goods.goodsCategoryID, goods.goodsSlug);
  }
}
