import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { GalleryRepository } from '../../repositories/gallery.repository';
import { GalleryListItem } from '../../entities/gallery';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { GalleryIndexView } from './gallery.index.view';

@Injectable()
export class GalleryIndexPresenter extends BasePresenter<GalleryIndexView> {
  private galleryRepo = inject(GalleryRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param gallery_dto.Filter (filters['eventName']/['eventTheme']
   *  dipetakan langsung, dateFrom/dateTo memfilter createdDate). Tanpa
   *  status — modul galeri tidak punya konsep publish/draft. */
  list(params: CmsListParams): Observable<Pagination<GalleryListItem>> {
    return this.galleryRepo.cmsList({
      page: params.page, limit: params.limit, sort_by: params.sort.replace(/^-/, ''),
      sort_order: params.sort.startsWith('-') ? 'desc' : 'asc',
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      eventName: (params.filters['eventName'] ?? [])[0] ?? '',
      eventTheme: (params.filters['eventTheme'] ?? [])[0] ?? '',
    });
  }

  remove(id: number): void {
    this.galleryRepo.remove(id).subscribe({
      next: () => { this.toast.success('Galeri dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(id); },
      error: () => this.view.onActionSettled(id),
    });
  }

  bulkDelete(ids: number[]): void {
    this.galleryRepo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success('Galeri terpilih dihapus'); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
