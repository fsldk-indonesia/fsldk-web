import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { News } from '../../../news/entities/news';
import { HomeIndexPresenter } from './home.index.presenter';
import { HomeIndexView } from './home.index.view';

@Component({
  selector: 'app-home-index-page',
  standalone: true,
  templateUrl: './home.index.page.html',
  imports: [RouterLink, DatePipe],
  providers: [HomeIndexPresenter],
  styles: [`
    .hero { background: linear-gradient(180deg, #ffffff 0%, var(--color-primary-soft) 100%); padding: 80px 0 90px; }
    .hero-badge { display: inline-block; background: #fff; border: 1px solid var(--color-border); color: var(--color-primary-dark); padding: 8px 18px; border-radius: 999px; font-weight: 600; font-size: .85rem; margin-bottom: 24px; }
    .hero-title { font-size: clamp(2.4rem, 6vw, 4rem); font-weight: 800; max-width: 780px; line-height: 1.08; }
    .hero-sub { max-width: 620px; font-size: 1.12rem; color: var(--color-text-secondary); }
    .news-card { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow .18s, transform .18s; }
    .news-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .news-thumb { aspect-ratio: 16/10; background: repeating-linear-gradient(45deg, #eef0ee, #eef0ee 12px, #e8eae8 12px, #e8eae8 24px); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; letter-spacing: .1em; }
    .news-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .news-body { padding: 20px; } .news-body h3 { margin: 12px 0 8px; font-size: 1.15rem; }
    .meta { color: var(--color-muted); font-size: .85rem; margin: 0; }
  `],
})
export class HomeIndexPage implements OnInit, HomeIndexView {
  private presenter = inject(HomeIndexPresenter);

  news = signal<News[]>([]);
  content = signal<Record<string, string>>({});
  loading = signal(true);
  defaultSub = 'FSLDK Indonesia adalah forum silaturahmi dan pusat koordinasi bagi Lembaga Dakwah Kampus di seluruh negeri — merawat ukhuwah, membina kader, dan menggerakkan dakwah yang terpadu dan kompak.';

  ngOnInit(): void { this.presenter.attachView(this); this.presenter.load(); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setNews(news: News[]): void { this.news.set(news); }
  setContent(content: Record<string, string>): void { this.content.set(content); }
}
