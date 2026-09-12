import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { CatalogBookRepository } from '../../repositories/catalogbook.repository';
import { CatalogBook } from '../../entities/catalog-book';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsComboboxOption, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { CatalogBookIndexView } from './catalogbook.index.view';

@Injectable()
export class CatalogBookIndexPresenter extends BasePresenter<CatalogBookIndexView> {
  private bookRepo = inject(CatalogBookRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param catalogbook_dto.Filter (filters['title']/['author']/
   *  ['publisher']/['category'] dipetakan ke search/author/publisher/
   *  bookCategoryID, params.status ke status aktif/nonaktif). Kategori
   *  multi-select digabung comma-separated — backend parse lewat
   *  parseInt64List (lihat catalogbook_handler_impl.go). */
  list(params: CmsListParams): Observable<Pagination<CatalogBook>> {
    return this.bookRepo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort, status: params.status.join(','),
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['title'] ?? [])[0] ?? '',
      author: (params.filters['author'] ?? [])[0] ?? '',
      publisher: (params.filters['publisher'] ?? [])[0] ?? '',
      bookCategoryID: (params.filters['category'] ?? []).join(','),
    });
  }

  /** loadOptions untuk target-pencarian "Kategori" (mode combobox). */
  categoryOptions(): Observable<CmsComboboxOption[]> {
    return this.bookRepo.categories().pipe(map((cats) => cats.map((c) => ({ id: c.bookCategoryID, label: c.bookCategoryName }))));
  }

  togglePublish(b: CatalogBook): void {
    this.bookRepo.publish(b.bookID, !b.isActive).subscribe({
      next: () => { this.toast.success(b.isActive ? 'Buku dinonaktifkan' : 'Buku diaktifkan'); this.view.onPublishToggleSuccess(b.isActive); this.view.onActionSettled(b.bookID); },
      error: () => this.view.onActionSettled(b.bookID),
    });
  }

  remove(b: CatalogBook): void {
    this.bookRepo.remove(b.bookID).subscribe({
      next: () => { this.toast.success('Buku dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(b.bookID); },
      error: () => this.view.onActionSettled(b.bookID),
    });
  }

  bulkDelete(ids: number[]): void {
    this.bookRepo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} buku terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
