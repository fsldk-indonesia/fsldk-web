import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Comment } from '../../entities/comment';
import { CommentItemComponent } from '../../components/comment-item.component';
import { IconComponent } from '../../../../shared/icon.component';
import { CommentDetailPresenter } from './comment.detail.presenter';
import { CommentDetailView } from './comment.detail.view';

@Component({
  selector: 'app-comment-detail-page',
  standalone: true,
  templateUrl: './comment.detail.page.html',
  imports: [RouterLink, CommentItemComponent, IconComponent],
  providers: [CommentDetailPresenter],
  styles: [`
    .page-head { margin: 0 0 24px; }
    .page-head h1 { margin: 4px 0 2px; }
    .form-card { display: flex; flex-direction: column; gap: 20px; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; }
  `],
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
