import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { NewsRepository } from '../../repositories/news.repository';
import { News } from '../../entities/news';
import { map } from 'rxjs/operators';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsComboboxOption, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { NewsIndexView } from './news.index.view';

@Injectable()
export class NewsIndexPresenter extends BasePresenter<NewsIndexView> {
  private newsRepo = inject(NewsRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param news_dto.CMSFilter (filters['title']/['reporter']/['category']
   *  dipetakan ke search/reporter/category, lihat news.index.page.ts). Status
   *  & Kategori multi-select (array) digabung comma-separated — backend
   *  parse lewat dto.ParseCSV/ParseInt64CSV (lihat news_handler_impl.go). */
  list(params: CmsListParams): Observable<Pagination<News>> {
    return this.newsRepo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort, status: params.status.join(','),
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['title'] ?? [])[0] ?? '',
      reporter: (params.filters['reporter'] ?? [])[0] ?? '',
      category: (params.filters['category'] ?? []).join(','),
    });
  }

  /** loadOptions untuk target-pencarian "Kategori" (mode combobox) di config
   *  CmsIndexConfig — dipanggil sekali oleh CmsIndexComponent saat kotak
   *  pencarian kategori difokus pertama kali (hasilnya di-cache di sana). */
  categoryOptions(): Observable<CmsComboboxOption[]> {
    return this.newsRepo.categories().pipe(map((cats) => cats.map((c) => ({ id: c.categoryID, label: c.categoryName }))));
  }

  togglePublish(n: News): void {
    this.newsRepo.publish(n.newsID, !n.isPublished).subscribe({
      next: () => { this.toast.success(n.isPublished ? 'Publikasi ditarik' : 'Berita dipublikasikan'); this.view.onPublishToggleSuccess(n.isPublished); this.view.onActionSettled(n.newsID); },
      error: () => this.view.onActionSettled(n.newsID),
    });
  }

  remove(n: News): void {
    this.newsRepo.remove(n.newsID).subscribe({
      next: () => { this.toast.success('Berita dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(n.newsID); },
      error: () => this.view.onActionSettled(n.newsID),
    });
  }

  bulkDelete(ids: number[]): void {
    this.newsRepo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} berita terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
