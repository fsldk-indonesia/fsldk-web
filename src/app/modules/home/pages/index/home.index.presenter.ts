import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { NewsRepository } from '../../../news/repositories/news.repository';
import { ArticleRepository } from '../../../article/repositories/article.repository';
import { CatalogBookRepository } from '../../../catalogbook/repositories/catalogbook.repository';
import { EventRepository } from '../../../event/repositories/event.repository';
import { GoodsRepository } from '../../../goods/repositories/goods.repository';
import { ScheduleRepository } from '../../../schedule/repositories/schedule.repository';
import { CampaignRepository } from '../../../kantong-amal/repositories/campaign.repository';
import { GalleryApiService } from '../../../gallery/services/gallery-api.service';
import { HomeIndexView } from './home.index.view';

/** "YYYY-MM-DD" for a date offset by the given number of days from today. */
function isoDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class HomeIndexPresenter extends BasePresenter<HomeIndexView> {
  private newsRepo = inject(NewsRepository);
  private articleRepo = inject(ArticleRepository);
  private catalogBookRepo = inject(CatalogBookRepository);
  private eventRepo = inject(EventRepository);
  private goodsRepo = inject(GoodsRepository);
  private scheduleRepo = inject(ScheduleRepository);
  private campaignRepo = inject(CampaignRepository);
  // GalleryApiService dipakai langsung (bukan GalleryRepository) — repository
  // itu menyimpan hasil publicGalleries sebagai signal singleton yang juga
  // dipakai halaman daftar galeri penuh; memanggil loadPublic() dari sini
  // akan menimpa state itu dan bikin flash data 1 item saat pindah halaman.
  private galleryApi = inject(GalleryApiService);

  load(): void {
    this.view.setLoading(true);
    // publicList (bukan featured()) — featured() hanya mengambil berita ber-flag
    // isFeatured=1 (kurasi manual editor), yang bisa saja bukan berita terbaru.
    // publicList default sort backend-nya sudah "-createdDate" (terbaru dulu).
    this.newsRepo.publicList({ page: 1, limit: 3 }).subscribe({
      next: (p) => { this.view.setNews(p.data); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
    this.articleRepo.publicList({ page: 1, limit: 3 }).subscribe({
      next: (p) => this.view.setArticles(p.data),
      error: () => this.view.setArticles([]),
    });
    this.catalogBookRepo.publicList({ page: 1, limit: 5 }).subscribe({
      next: (p) => this.view.setCatalogBooks(p.data),
      error: () => this.view.setCatalogBooks([]),
    });
    this.eventRepo.publicList({ page: 1, limit: 5 }).subscribe({
      next: (p) => this.view.setEvents(p.data),
      error: () => this.view.setEvents([]),
    });
    this.goodsRepo.publicList({ page: 1, limit: 5 }).subscribe({
      next: (p) => this.view.setGoods(p.data),
      error: () => this.view.setGoods([]),
    });
    this.scheduleRepo.publicRange(isoDate(0), isoDate(60)).subscribe({
      next: (schedules) => this.view.setSchedules(schedules.slice(0, 5)),
      error: () => this.view.setSchedules([]),
    });
    this.campaignRepo.publicList({ page: 1, limit: 5 }).subscribe({
      next: (p) => this.view.setCampaigns(p.data),
      error: () => this.view.setCampaigns([]),
    });
    this.galleryApi.listPublic(1, 1, 'newest').subscribe({
      next: (res) => this.view.setLatestGallery(res.result.data[0] ?? null),
      error: () => this.view.setLatestGallery(null),
    });
  }
}
