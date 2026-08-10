import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { ArticleRepository } from '../../repositories/article.repository';
import { Article } from '../../entities/article';
import { ArticleIndexView } from './article.index.view';

@Injectable()
export class ArticleIndexPresenter extends BasePresenter<ArticleIndexView> {
  private articleRepo = inject(ArticleRepository);
  private toast = inject(ToastService);

  load(page: number, limit: number, status: string): void {
    this.articleRepo.cmsList({ page, limit, status }).subscribe({ next: (p) => this.view.setArticles(p.data, p.count), error: () => {} });
  }

  togglePublish(a: Article): void {
    this.articleRepo.publish(a.articleID, !a.isPublished).subscribe({
      next: () => { this.toast.success(a.isPublished ? 'Publikasi ditarik' : 'Artikel dipublikasikan'); this.view.onPublishToggleSuccess(); this.view.onActionSettled(a.articleID); },
      error: () => this.view.onActionSettled(a.articleID),
    });
  }

  remove(a: Article): void {
    this.articleRepo.remove(a.articleID).subscribe({
      next: () => { this.toast.success('Artikel dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(a.articleID); },
      error: () => this.view.onActionSettled(a.articleID),
    });
  }
}
