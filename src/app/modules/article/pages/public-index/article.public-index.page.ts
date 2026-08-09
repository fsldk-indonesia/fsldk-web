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
  `],
})
export class ArticlePublicIndexPage implements OnInit, ArticlePublicIndexView {
  private presenter = inject(ArticlePublicIndexPresenter);

  items = signal<Article[]>([]);
  categories = signal<ArticleCategory[]>([]);
  loading = signal(true);
  search = '';
  cat = '';

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadCategories();
    this.load();
  }

  load(): void { this.presenter.load(this.search, this.cat); }
  apply(): void { this.load(); }
  filter(s: string): void { this.cat = s; this.load(); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setArticles(articles: Article[]): void { this.items.set(articles); }
  setCategories(categories: ArticleCategory[]): void { this.categories.set(categories); }
}
