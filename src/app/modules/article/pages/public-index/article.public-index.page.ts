import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Article } from '../../entities/article';
import { ArticleCategory } from '../../entities/article-category';
import { IconComponent } from '../../../../shared/icon.component';
import { ArticlePublicIndexPresenter } from './article.public-index.presenter';
import { ArticlePublicIndexView } from './article.public-index.view';

@Component({
  selector: 'app-article-public-index-page',
  standalone: true,
  templateUrl: './article.public-index.page.html',
  imports: [RouterLink, DatePipe, FormsModule, IconComponent],
  providers: [ArticlePublicIndexPresenter],
  styles: [`
    /* Gradien hijau lembut menutupi SELURUH section (bukan cuma wash atas
       yang memudar ke putih) — halaman pendek (mis. hasil pencarian kosong)
       tidak lagi berakhir di area putih polos di bawahnya. */
    .section { background: linear-gradient(180deg, var(--color-primary-soft) 0%, var(--color-primary-tint) 100%); }
    .filters { display: flex; flex-direction: column; gap: 16px; align-items: center; }
    .search { max-width: 460px; }
    .chips { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    .news-card { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .news-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .news-thumb { aspect-ratio: 16/10; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; }
    .news-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .news-body { padding: 20px; } .news-body h3 { margin: 12px 0 8px; font-size: 1.12rem; }
    .meta { color: var(--color-muted); font-size: .85rem; margin: 8px 0 0; }
    .chip-pdf { display: inline-block; margin-top: 10px; font-size: .78rem; background: var(--color-primary-soft); color: var(--color-primary-dark); padding: 4px 10px; border-radius: var(--radius-full); font-weight: 600; }
    .pager { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 36px; color: var(--color-text-secondary); font-size: .9rem; }
  `],
})
export class ArticlePublicIndexPage implements OnInit, ArticlePublicIndexView {
  private presenter = inject(ArticlePublicIndexPresenter);

  items = signal<Article[]>([]);
  categories = signal<ArticleCategory[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 9;
  search = '';
  cat = '';

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadCategories();
    this.load();
  }

  load(): void { this.presenter.load(this.page(), this.limit, this.search, this.cat); }
  apply(): void { this.page.set(1); this.load(); }
  filter(s: string): void { this.cat = s; this.page.set(1); this.load(); }
  go(p: number): void { this.page.set(p); this.load(); }
  totalPages(): number { return Math.max(1, Math.ceil(this.count() / this.limit)); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setArticles(articles: Article[], count: number): void { this.items.set(articles); this.count.set(count); }
  setCategories(categories: ArticleCategory[]): void { this.categories.set(categories); }
}
