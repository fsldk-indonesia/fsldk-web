import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { NewsRepository } from '../../repositories/news.repository';
import { NewsPublicDetailView } from './news.public-detail.view';

@Injectable()
export class NewsPublicDetailPresenter extends BasePresenter<NewsPublicDetailView> {
  private newsRepo = inject(NewsRepository);

  load(slug: string): void {
    this.view.setLoading(true);
    this.newsRepo.publicDetail(slug).subscribe({
      next: (n) => { this.view.setNews(n); this.view.setLoading(false); },
      error: () => { this.view.setNews(null); this.view.setLoading(false); },
    });
  }
}
