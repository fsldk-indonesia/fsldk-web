import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ArticleRepository } from '../../repositories/article.repository';
import { ArticlePublicDetailView } from './article.public-detail.view';

@Injectable()
export class ArticlePublicDetailPresenter extends BasePresenter<ArticlePublicDetailView> {
  private articleRepo = inject(ArticleRepository);

  load(slug: string): void {
    this.view.setLoading(true);
    this.articleRepo.publicDetail(slug).subscribe({
      next: (a) => { this.view.setArticle(a); this.view.setLoading(false); },
      error: () => { this.view.setArticle(null); this.view.setLoading(false); },
    });
  }
}
