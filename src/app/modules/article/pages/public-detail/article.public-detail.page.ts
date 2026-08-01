import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Article } from '../../entities/article';
import { ArticlePublicDetailPresenter } from './article.public-detail.presenter';
import { ArticlePublicDetailView } from './article.public-detail.view';

@Component({
  selector: 'app-article-public-detail-page',
  standalone: true,
  templateUrl: './article.public-detail.page.html',
  imports: [RouterLink, DatePipe],
  providers: [ArticlePublicDetailPresenter],
  styles: [`
    .narrow { max-width: 760px; }
    .crumb { color: var(--color-muted); font-size: .9rem; margin-bottom: 16px; }
    h1 { margin: 12px 0; }
    .meta { color: var(--color-muted); font-size: .92rem; }
    .cover { width: 100%; border-radius: var(--radius-lg); margin: 20px 0 28px; aspect-ratio: 16/9; object-fit: cover; }
    .content { font-size: 1.08rem; line-height: 1.85; color: #2a2d33; }
  `],
})
export class ArticlePublicDetailPage implements OnInit, ArticlePublicDetailView {
  private presenter = inject(ArticlePublicDetailPresenter);
  private route = inject(ActivatedRoute);

  item = signal<Article | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load(this.route.snapshot.paramMap.get('slug')!);
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setArticle(article: Article | null): void { this.item.set(article); }
}
