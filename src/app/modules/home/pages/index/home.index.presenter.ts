import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { NewsRepository } from '../../../news/repositories/news.repository';
import { HomeIndexView } from './home.index.view';

@Injectable()
export class HomeIndexPresenter extends BasePresenter<HomeIndexView> {
  private newsRepo = inject(NewsRepository);

  load(): void {
    this.view.setLoading(true);
    this.newsRepo.publicList({ page: 1, limit: 6 }).subscribe({
      next: (p) => { this.view.setNews(p.data); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
