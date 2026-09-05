import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { NewsRepository } from '../../../news/repositories/news.repository';
import { ArticleRepository } from '../../../article/repositories/article.repository';
import { CatalogBookRepository } from '../../../catalogbook/repositories/catalogbook.repository';
import { EventRepository } from '../../../event/repositories/event.repository';
import { GoodsRepository } from '../../../goods/repositories/goods.repository';
import { ScheduleRepository } from '../../../schedule/repositories/schedule.repository';
import { CampaignRepository } from '../../../kantong-amal/repositories/campaign.repository';
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

  load(): void {
    this.view.setLoading(true);
    this.newsRepo.featured(3).subscribe({
      next: (news) => { this.view.setNews(news); this.view.setLoading(false); },
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
  }
}
