import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { NewsRepository } from '../../repositories/news.repository';
import { NewsPublicIndexView } from './news.public-index.view';

@Injectable()
export class NewsPublicIndexPresenter extends BasePresenter<NewsPublicIndexView> {
  private newsRepo = inject(NewsRepository);

  loadCategories(): void {
    this.newsRepo.categories().subscribe({ next: (c) => this.view.setCategories(c), error: () => {} });
  }

  load(page: number, limit: number, search: string, category: string): void {
    this.view.setLoading(true);
    this.newsRepo.publicList({ page, limit, search, category }).subscribe({
      next: (p) => { this.view.setNews(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
