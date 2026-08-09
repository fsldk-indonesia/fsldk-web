import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { News } from '../../entities/news';
import { NewsPublicDetailPresenter } from './news.public-detail.presenter';
import { NewsPublicDetailView } from './news.public-detail.view';

@Component({
  selector: 'app-news-public-detail-page',
  standalone: true,
  templateUrl: './news.public-detail.page.html',
  imports: [RouterLink, DatePipe],
  providers: [NewsPublicDetailPresenter],
  styles: [`
    .narrow { max-width: 760px; }
    .crumb { color: var(--color-muted); font-size: .9rem; margin-bottom: 16px; }
    h1 { margin: 12px 0; font-size: clamp(1.8rem, 4vw, 2.6rem); }
    .meta { color: var(--color-muted); font-size: .92rem; }
    .cover { width: 100%; border-radius: var(--radius-lg); margin: 20px 0 28px; aspect-ratio: 16/9; object-fit: cover; }
    .cover.placeholder { background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-primary-dark); letter-spacing: .1em; font-weight: 700; }
    .content { font-size: 1.08rem; line-height: 1.85; color: var(--color-text); }
    .content ::ng-deep p { margin: 0 0 1.2em; }
  `],
})
export class NewsPublicDetailPage implements OnInit, NewsPublicDetailView {
  private presenter = inject(NewsPublicDetailPresenter);
  private route = inject(ActivatedRoute);

  news = signal<News | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load(this.route.snapshot.paramMap.get('slug')!);
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setNews(news: News | null): void { this.news.set(news); }
}
