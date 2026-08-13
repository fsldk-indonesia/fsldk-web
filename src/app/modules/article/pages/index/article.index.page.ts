import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { Article } from '../../entities/article';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { ArticleIndexPresenter } from './article.index.presenter';
import { ArticleIndexView } from './article.index.view';

@Component({
  selector: 'app-article-index-page',
  standalone: true,
  templateUrl: './article.index.page.html',
  imports: [RouterLink, DatePipe, IconComponent, PaginationComponent],
  providers: [ArticleIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class ArticleIndexPage implements OnInit, ArticleIndexView {
  private presenter = inject(ArticleIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  articles = signal<Article[]>([]);
  loading = signal(true);
  status = '';
  page = signal(1);
  count = signal(0);
  readonly limit = 10;
  busy = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('article.create');
  canUpdate = this.auth.hasPermission('article.update');
  canPublish = this.auth.hasPermission('article.publish');
  canDelete = this.auth.hasPermission('article.delete');

  ngOnInit(): void { this.presenter.attachView(this); this.load(); }

  load(): void { this.loading.set(true); this.presenter.load(this.page(), this.limit, this.status); }
  filter(s: string): void { this.status = s; this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  togglePublish(a: Article): void { this.setBusy(a.articleID); this.presenter.togglePublish(a); }
  async remove(a: Article, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus artikel "${a.articleTitle}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Artikel', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(a.articleID);
    this.presenter.remove(a);
  }

  setArticles(articles: Article[], count: number): void { this.articles.set(articles); this.count.set(count); this.loading.set(false); }
  onPublishToggleSuccess(): void { this.load(); }
  onRemoveSuccess(): void { this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
