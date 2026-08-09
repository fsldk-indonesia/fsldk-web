import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { NewsRepository } from '../../../news/repositories/news.repository';
import { ArticleRepository } from '../../../article/repositories/article.repository';
import { HomeIndexView } from './home.index.view';

@Injectable()
export class HomeIndexPresenter extends BasePresenter<HomeIndexView> {
  private newsRepo = inject(NewsRepository);
  private articleRepo = inject(ArticleRepository);

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
  }
}
