import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { ArticleRepository } from '../../repositories/article.repository';
import { Article } from '../../entities/article';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsComboboxOption, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { ArticleIndexView } from './article.index.view';

@Injectable()
export class ArticleIndexPresenter extends BasePresenter<ArticleIndexView> {
  private articleRepo = inject(ArticleRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param article_dto.CMSFilter (filters['title']/['writer']/['category']
   *  dipetakan ke search/writer/category, lihat article.index.page.ts). */
  list(params: CmsListParams): Observable<Pagination<Article>> {
    return this.articleRepo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort, status: params.status,
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: params.filters['title'] ?? '', writer: params.filters['writer'] ?? '', category: params.filters['category'] ?? '',
    });
  }

  /** loadOptions untuk target-pencarian "Kategori" (mode combobox) di config
   *  CmsIndexConfig — dipanggil sekali oleh CmsIndexComponent saat kotak
   *  pencarian kategori difokus pertama kali (hasilnya di-cache di sana). */
  categoryOptions(): Observable<CmsComboboxOption[]> {
    return this.articleRepo.categories().pipe(map((cats) => cats.map((c) => ({ id: c.categoryID, label: c.categoryName }))));
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

  bulkDelete(ids: number[]): void {
    this.articleRepo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} artikel terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
