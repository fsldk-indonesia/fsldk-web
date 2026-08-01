import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { Article } from '../../entities/article';
import { ArticleIndexPresenter } from './article.index.presenter';
import { ArticleIndexView } from './article.index.view';

@Component({
  selector: 'app-article-index-page',
  standalone: true,
  templateUrl: './article.index.page.html',
  imports: [RouterLink, DatePipe],
  providers: [ArticleIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class ArticleIndexPage implements OnInit, ArticleIndexView {
  private presenter = inject(ArticleIndexPresenter);
  private auth = inject(AuthRepository);

  articles = signal<Article[]>([]);
  status = '';
  canCreate = this.auth.hasPermission('article.create');
  canUpdate = this.auth.hasPermission('article.update');
  canPublish = this.auth.hasPermission('article.publish');
  canDelete = this.auth.hasPermission('article.delete');

  ngOnInit(): void { this.presenter.attachView(this); this.load(); }

  load(): void { this.presenter.load(this.status); }
  filter(s: string): void { this.status = s; this.load(); }
  togglePublish(a: Article): void { this.presenter.togglePublish(a); }
  remove(a: Article): void {
    if (!confirm(`Hapus artikel "${a.articleTitle}"?`)) return;
    this.presenter.remove(a);
  }

  setArticles(articles: Article[]): void { this.articles.set(articles); }
  onPublishToggleSuccess(): void { this.load(); }
  onRemoveSuccess(): void { this.load(); }
}
