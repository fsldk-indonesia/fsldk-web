import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Comment } from '../../entities/comment';
import { CommentItemComponent } from '../../components/comment-item.component';
import { CommentDetailPresenter } from './comment.detail.presenter';
import { CommentDetailView } from './comment.detail.view';

@Component({
  selector: 'app-comment-detail-page',
  standalone: true,
  templateUrl: './comment.detail.page.html',
  imports: [RouterLink, CommentItemComponent],
  providers: [CommentDetailPresenter],
  styles: [`.page-head { margin-bottom: 24px; }`],
})
export class CommentDetailPage implements OnInit, CommentDetailView {
  private presenter = inject(CommentDetailPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  item = signal<Comment | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load(Number(this.route.snapshot.paramMap.get('id')));
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setComment(comment: Comment | null): void { this.item.set(comment); }

  /** `removed` dari <app-comment-item> di sini hanya bisa berarti komentar
   *  akar (yang sedang dilihat) yang dihapus — reply bersarang ditangani
   *  lokal oleh comment-item induknya sendiri, tidak bubble sampai ke sini.
   *  Tidak ada daftar untuk di-splice, jadi cukup kembali ke daftar komentar. */
  onRootRemoved(): void {
    this.router.navigateByUrl('/cms/comments');
  }
}
