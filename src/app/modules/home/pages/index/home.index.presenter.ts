import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { NewsRepository } from '../../../news/repositories/news.repository';
import { ArticleRepository } from '../../../article/repositories/article.repository';
import { CatalogBookRepository } from '../../../catalogbook/repositories/catalogbook.repository';
import { EventRepository } from '../../../event/repositories/event.repository';
import { GoodsRepository } from '../../../goods/repositories/goods.repository';
import { ScheduleRepository } from '../../../schedule/repositories/schedule.repository';
import { buildCalendarGrid, buildMonthView, monthName, toISODate } from '../../../schedule/schedule.constants';
import { CampaignRepository } from '../../../kantong-amal/repositories/campaign.repository';
import { GalleryApiService } from '../../../gallery/services/gallery-api.service';
import { HomeIndexView } from './home.index.view';

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
    this.newsRepo.publicList({ page: 1, limit: 5 }).subscribe({
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
    this.eventRepo.publicList({ page: 1, limit: 6 }).subscribe({
      next: (p) => this.view.setEvents(p.data),
      error: () => this.view.setEvents([]),
    });
    this.goodsRepo.publicList({ page: 1, limit: 5 }).subscribe({
      next: (p) => this.view.setGoods(p.data),
      error: () => this.view.setGoods([]),
    });
    // Bulan berjalan (bukan lagi "60 hari ke depan, ambil 5") — supaya
    // kalender mini di Beranda menampilkan bulan ini persis seperti /jadwal
    // index, cuma tanpa navigasi prev/next (lihat buildMonthView()).
    const now = new Date();
    const scheduleYear = now.getFullYear();
    const scheduleMonth = now.getMonth() + 1;
    this.view.setSchedulePeriodLabel(`${monthName(scheduleMonth)} ${scheduleYear}`);
    const scheduleGrid = buildCalendarGrid(scheduleYear, scheduleMonth);
    this.scheduleRepo.publicRange(toISODate(scheduleGrid[0]), toISODate(scheduleGrid[scheduleGrid.length - 1])).subscribe({
      next: (rows) => this.view.setScheduleWeeks(buildMonthView(scheduleYear, scheduleMonth, rows ?? []).weeks),
      error: () => this.view.setScheduleWeeks([]),
    });
    this.campaignRepo.publicList({ page: 1, limit: 5 }).subscribe({
      next: (p) => this.view.setCampaigns(p.data),
      error: () => this.view.setCampaigns([]),
    });
    this.galleryApi.listPublic(1, 1, 'newest').subscribe({
      next: (res) => this.view.setLatestGallery(res.data[0] ?? null),
      error: () => this.view.setLatestGallery(null),
    });
  }
}
