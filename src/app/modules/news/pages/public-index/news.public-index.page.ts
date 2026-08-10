import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { News } from '../../entities/news';
import { NewsCategory } from '../../entities/news-category';
import { IconComponent } from '../../../../shared/icon.component';
import { NewsPublicIndexPresenter } from './news.public-index.presenter';
import { NewsPublicIndexView } from './news.public-index.view';

@Component({
  selector: 'app-news-public-index-page',
  standalone: true,
  templateUrl: './news.public-index.page.html',
  imports: [RouterLink, DatePipe, FormsModule, IconComponent],
  providers: [NewsPublicIndexPresenter],
  styles: [`
    /* Wash gradien hijau di bagian atas halaman (bukan motif batik seperti
       beranda) — memudar ke putih pada jarak piksel tetap, jadi tetap
       terlihat rapi walau daftar beritanya panjang. */
    .section { background: linear-gradient(180deg, var(--color-primary-soft) 0%, var(--color-primary-tint) 220px, #fff 520px); }
    .filters { display: flex; flex-direction: column; gap: 16px; align-items: center; }
    .search { max-width: 460px; }
    .chips { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    .news-card { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .news-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .news-thumb { aspect-ratio: 16/10; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; }
    .news-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .news-body { padding: 20px; } .news-body h3 { margin: 12px 0 8px; font-size: 1.12rem; }
    .excerpt { color: var(--color-text-secondary); font-size: .9rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .meta { color: var(--color-muted); font-size: .85rem; margin: 8px 0 0; }
    .pager { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 36px; color: var(--color-text-secondary); font-size: .9rem; }
  `],
})
export class NewsPublicIndexPage implements OnInit, NewsPublicIndexView {
  private presenter = inject(NewsPublicIndexPresenter);

  news = signal<News[]>([]);
  categories = signal<NewsCategory[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 9;
  search = '';
  activeCat = '';

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadCategories();
    this.load();
  }

  load(): void { this.presenter.load(this.page(), this.limit, this.search, this.activeCat); }

  applySearch(): void { this.page.set(1); this.load(); }
  filterCat(slug: string): void { this.activeCat = slug; this.page.set(1); this.load(); }
  go(p: number): void { this.page.set(p); this.load(); }
  totalPages(): number { return Math.max(1, Math.ceil(this.count() / this.limit)); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setNews(news: News[], count: number): void { this.news.set(news); this.count.set(count); }
  setCategories(categories: NewsCategory[]): void { this.categories.set(categories); }
}
