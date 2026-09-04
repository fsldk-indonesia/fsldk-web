import { Component, OnInit, computed, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-goods-public-detail-page',
  standalone: true,
  templateUrl: './goods.public-detail.page.html',
  imports: [RouterLink, IconComponent, ImageGalleryComponent],
  providers: [GoodsPublicDetailPresenter],
  styles: [`
    .layout { display: grid; grid-template-columns: 420px 1fr; gap: 40px; }
    @media (max-width: 760px) { .layout { grid-template-columns: 1fr; } }
    .crumb { color: var(--color-muted); font-size: .9rem; margin-bottom: 16px; }
    h1 { margin: 4px 0 8px; }
    .price { font-size: 1.6rem; font-weight: 800; color: var(--color-primary-dark); margin: 6px 0 16px; }
    .short-desc { color: var(--color-text-secondary); font-size: 1rem; line-height: 1.6; margin: 0 0 16px; }
    .meta-list { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 0 0 20px; color: var(--color-text-secondary); font-size: .92rem; }
    .meta-list strong { color: var(--color-text); }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }
    .content { font-size: 1.02rem; line-height: 1.8; color: var(--color-text); margin-top: 28px; }
    .content h3 { margin-bottom: 10px; }
  `],
})
export class GoodsPublicDetailPage implements OnInit, GoodsPublicDetailView {
  private presenter = inject(GoodsPublicDetailPresenter);
  private route = inject(ActivatedRoute);

  item = signal<GoodsDetail | null>(null);
  loading = signal(true);
  readonly formatRupiah = formatRupiah;
  readonly availabilityLabels = AVAILABILITY_LABELS;

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
