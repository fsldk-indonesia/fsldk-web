import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { NewsRepository } from '../../../news/repositories/news.repository';
import { ContentRepository } from '../../../content/repositories/content.repository';
import { HomeIndexView } from './home.index.view';

@Injectable()
export class HomeIndexPresenter extends BasePresenter<HomeIndexView> {
  private newsRepo = inject(NewsRepository);
  private contentRepo = inject(ContentRepository);

  load(): void {
    this.contentRepo.profile().subscribe({ next: (c) => this.view.setContent(c), error: () => {} });
    this.view.setLoading(true);
    this.newsRepo.publicList({ page: 1, limit: 6 }).subscribe({
      next: (p) => { this.view.setNews(p.data); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
