import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { NewsRepository } from '../../repositories/news.repository';
import { News } from '../../entities/news';
import { NewsIndexView } from './news.index.view';

@Injectable()
export class NewsIndexPresenter extends BasePresenter<NewsIndexView> {
  private newsRepo = inject(NewsRepository);
  private toast = inject(ToastService);

  load(page: number, limit: number, status: string): void {
    this.newsRepo.cmsList({ page, limit, status }).subscribe({ next: (p) => this.view.setNews(p.data, p.count), error: () => {} });
  }

  togglePublish(n: News): void {
    this.newsRepo.publish(n.newsID, !n.isPublished).subscribe({
      next: () => { this.toast.success(n.isPublished ? 'Publikasi ditarik' : 'Berita dipublikasikan'); this.view.onPublishToggleSuccess(n.isPublished); this.view.onActionSettled(n.newsID); },
      error: () => this.view.onActionSettled(n.newsID),
    });
  }

  remove(n: News): void {
    this.newsRepo.remove(n.newsID).subscribe({
      next: () => { this.toast.success('Berita dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(n.newsID); },
      error: () => this.view.onActionSettled(n.newsID),
    });
  }
}
