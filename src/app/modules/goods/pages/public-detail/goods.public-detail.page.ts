import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { GoodsDetail } from '../../entities/goods';
import { IconComponent } from '../../../../shared/icon.component';
import { ImageGalleryComponent } from '../../../../shared/image-gallery.component';
import { GoodsPublicDetailPresenter } from './goods.public-detail.presenter';
import { GoodsPublicDetailView } from './goods.public-detail.view';

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

@Component({
  selector: 'app-goods-public-detail-page',
  standalone: true,
  templateUrl: './goods.public-detail.page.html',
  imports: [RouterLink, NgClass, IconComponent, ImageGalleryComponent],
  providers: [GoodsPublicDetailPresenter],
  styles: [`
    .section { background: linear-gradient(180deg, var(--color-primary-tint) 0%, #fff 340px); }
    .layout { display: grid; grid-template-columns: minmax(0, 440px) 1fr; gap: 56px; align-items: start; }
    @media (max-width: 760px) { .layout { grid-template-columns: 1fr; gap: 32px; } }

    .crumb { display: flex; align-items: center; gap: 8px; color: var(--color-muted); font-size: .86rem; font-weight: 600; margin-bottom: 28px; }
    .crumb a { color: var(--color-text-secondary); }
    .crumb a:hover { color: var(--color-primary-dark); }
    .crumb span { color: var(--color-text); }

    .badge-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 14px; }

    .product-title { font-size: clamp(1.6rem, 3vw, 2.2rem); line-height: 1.2; margin: 0 0 12px; }

    .price { font-size: 1.9rem; font-weight: 800; color: var(--color-primary-dark); margin: 0 0 18px; }

    .lead { font-size: 1.05rem; line-height: 1.6; color: var(--color-text-secondary); margin: 0 0 22px; max-width: 52ch; }

    .status-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; padding: 16px 0; margin: 0 0 24px; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
    .sku { display: inline-flex; align-items: center; gap: 6px; color: var(--color-text-secondary); font-size: .86rem; }
    .sku code { font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; background: var(--color-bg-alt); color: var(--color-text); padding: 2px 8px; border-radius: 6px; font-size: .82rem; }

    .actions { margin: 0 0 8px; }
    .btn-block { width: 100%; justify-content: center; padding-top: 15px; padding-bottom: 15px; font-size: 1rem; }
    .purchase-hint { margin: 10px 0 0; font-size: .82rem; color: var(--color-muted); text-align: center; }

    .description { margin-top: 40px; padding-top: 32px; border-top: 1px solid var(--color-border); }
    .description h2 { font-size: 1.15rem; margin: 0 0 14px; }
    .prose { font-size: 1rem; line-height: 1.8; color: var(--color-text); max-width: 68ch; }
    .prose :is(p, ul, ol) { margin: 0 0 1em; }
    .prose :is(ul, ol) { padding-left: 1.3em; }
    .prose img { max-width: 100%; border-radius: var(--radius-sm); }
    .prose :last-child { margin-bottom: 0; }

    .back-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 32px; color: var(--color-text-secondary); font-weight: 600; font-size: .9rem; }
    .back-link:hover { color: var(--color-primary-dark); }
  `],
})
export class GoodsPublicDetailPage implements OnInit, GoodsPublicDetailView {
  private presenter = inject(GoodsPublicDetailPresenter);
  private route = inject(ActivatedRoute);

  item = signal<GoodsDetail | null>(null);
  loading = signal(true);
  readonly formatRupiah = formatRupiah;
  readonly availabilityLabels = AVAILABILITY_LABELS;
  readonly availabilityBadgeClass = AVAILABILITY_BADGE_CLASS;

  galleryImages = computed(() => {
    const g = this.item();
    if (!g) return [];
    return [g.mainImageUrl, ...g.images].filter((url): url is string => !!url);
  });

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load(this.route.snapshot.paramMap.get('slug')!);
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setGoods(goods: GoodsDetail | null): void { this.item.set(goods); }
}
