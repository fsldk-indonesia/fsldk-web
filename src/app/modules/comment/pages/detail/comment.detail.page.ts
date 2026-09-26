import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Comment, ReactionType } from '../../entities/comment';
import { REACTIONS } from '../../comment.constants';
import { IconComponent } from '../../../../shared/icon.component';
import { CommentDetailPresenter } from './comment.detail.presenter';
import { CommentDetailView } from './comment.detail.view';

@Component({
  selector: 'app-comment-detail-page',
  standalone: true,
  templateUrl: './comment.detail.page.html',
  imports: [RouterLink, DatePipe, IconComponent],
  providers: [CommentDetailPresenter],
  styles: [`
    .page-head { margin: 0 0 24px; }
    .page-head h1 { margin: 0 0 2px; }
    .view-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start; }
    @media (max-width: 860px) { .view-grid { grid-template-columns: 1fr; } }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 20px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .view-cols { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
    .view-cols.three { grid-template-columns: repeat(3, 1fr); }
    .view-row { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin-bottom: 20px; }
    .view-row:last-child { margin-bottom: 0; }
    .view-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--color-text-muted); display: flex; align-items: center; gap: 6px; }
    .view-value { font-weight: 600; margin: 0; white-space: pre-wrap; word-break: break-word; }
    .view-sub { font-size: .82rem; font-weight: 400; }
    .view-author { display: flex; align-items: center; gap: 10px; }
    .view-reactions { display: flex; flex-wrap: wrap; gap: 8px; }
    .reaction-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: var(--radius-full); background: var(--color-bg-alt); font-size: .85rem; font-weight: 600; }
    .view-media { max-width: 100%; border-radius: var(--radius-md); display: block; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
  `],
})
export class CommentDetailPage implements OnInit, CommentDetailView {
  private presenter = inject(CommentDetailPresenter);
  private route = inject(ActivatedRoute);

  readonly reactions = REACTIONS;

  item = signal<Comment | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load(Number(this.route.snapshot.paramMap.get('id')));
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setComment(comment: Comment | null): void { this.item.set(comment); }

  totalReactions(c: Comment): number {
    return Object.values(c.reactions.counts).reduce((sum, n) => sum + (n ?? 0), 0);
  }

  activeReactionTypes(c: Comment): ReactionType[] {
    return this.reactions.map((r) => r.type).filter((type) => (c.reactions.counts[type] ?? 0) > 0);
  }

  reactionEmoji(type: ReactionType): string {
    return this.reactions.find((r) => r.type === type)?.emoji ?? '';
  }
}
