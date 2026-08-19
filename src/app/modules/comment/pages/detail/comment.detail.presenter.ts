import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { CommentRepository } from '../../repositories/comment.repository';
import { CommentDetailView } from './comment.detail.view';

@Injectable()
export class CommentDetailPresenter extends BasePresenter<CommentDetailView> {
  private commentRepo = inject(CommentRepository);

  load(id: number): void {
    this.view.setLoading(true);
    this.commentRepo.cmsGet(id).subscribe({
      next: (c) => { this.view.setComment(c); this.view.setLoading(false); },
      error: () => { this.view.setComment(null); this.view.setLoading(false); },
    });
  }
}
