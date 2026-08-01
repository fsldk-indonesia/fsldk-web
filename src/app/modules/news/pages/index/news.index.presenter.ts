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

  load(status: string): void {
    this.newsRepo.cmsList({ page: 1, limit: 50, status }).subscribe({ next: (p) => this.view.setNews(p.data), error: () => {} });
  }

  togglePublish(n: News): void {
    this.newsRepo.publish(n.newsID, !n.isPublished).subscribe({
      next: () => { this.toast.success(n.isPublished ? 'Publikasi ditarik' : 'Berita dipublikasikan'); this.view.onPublishToggleSuccess(n.isPublished); },
      error: () => {},
    });
  }

  remove(n: News): void {
    this.newsRepo.remove(n.newsID).subscribe({
      next: () => { this.toast.success('Berita dihapus'); this.view.onRemoveSuccess(); },
      error: () => {},
    });
  }
}
