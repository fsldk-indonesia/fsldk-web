import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ArticleRepository } from '../../repositories/article.repository';
import { ArticlePublicIndexView } from './article.public-index.view';

@Injectable()
export class ArticlePublicIndexPresenter extends BasePresenter<ArticlePublicIndexView> {
  private articleRepo = inject(ArticleRepository);

  loadCategories(): void {
    this.articleRepo.categories().subscribe({ next: (c) => this.view.setCategories(c), error: () => {} });
  }

  load(page: number, limit: number, search: string, category: string): void {
    this.view.setLoading(true);
    this.articleRepo.publicList({ page, limit, search, category }).subscribe({
      next: (p) => { this.view.setArticles(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
