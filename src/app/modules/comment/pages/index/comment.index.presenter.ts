import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { CommentRepository } from '../../repositories/comment.repository';
import { CommentIndexView } from './comment.index.view';

@Injectable()
export class CommentIndexPresenter extends BasePresenter<CommentIndexView> {
  private commentRepo = inject(CommentRepository);
  private toast = inject(ToastService);

  load(page: number, limit: number, contentType: string, search: string): void {
    this.commentRepo.cmsList({ page, limit, contentType, search }).subscribe({
      next: (p) => this.view.setComments(p.data, p.count),
      error: () => {},
    });
  }

  remove(id: number): void {
    this.commentRepo.remove(id).subscribe({
      next: () => { this.toast.success('Komentar dihapus'); this.view.onRemoveSuccess(); },
      error: () => {},
    });
  }

  bulkDelete(ids: number[]): void {
    this.commentRepo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success('Komentar terpilih dihapus'); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
