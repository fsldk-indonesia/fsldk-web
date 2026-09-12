import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { CommentRepository } from '../../repositories/comment.repository';
import { Comment } from '../../entities/comment';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { CommentIndexView } from './comment.index.view';

@Injectable()
export class CommentIndexPresenter extends BasePresenter<CommentIndexView> {
  private commentRepo = inject(CommentRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param comment_dto.CMSFilter (filters['search']/['author']/['contentType']
   *  dipetakan ke search/author/contentType, lihat comment.index.page.ts).
   *  Komentar & Penulis SENGAJA dua target pencarian terpisah (bukan satu OR
   *  gabungan seperti sebelumnya) — konsisten dengan Judul/Reporter di
   *  Berita. Tipe Konten multi-select (array) digabung comma-separated —
   *  backend parse lewat dto.ParseCSV (lihat comment_handler_impl.go). */
  list(params: CmsListParams): Observable<Pagination<Comment>> {
    return this.commentRepo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort,
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['search'] ?? [])[0] ?? '',
      author: (params.filters['author'] ?? [])[0] ?? '',
      contentType: (params.filters['contentType'] ?? []).join(','),
    });
  }

  remove(id: number): void {
    this.commentRepo.remove(id).subscribe({
      next: () => { this.toast.success('Komentar dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(id); },
      error: () => this.view.onActionSettled(id),
    });
  }

  bulkDelete(ids: number[]): void {
    this.commentRepo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success('Komentar terpilih dihapus'); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
