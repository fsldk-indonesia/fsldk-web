import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { News } from '../../entities/news';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { NewsIndexPresenter } from './news.index.presenter';
import { NewsIndexView } from './news.index.view';

@Component({
  selector: 'app-news-index-page',
  standalone: true,
  templateUrl: './news.index.page.html',
  imports: [RouterLink, DatePipe, IconComponent, PaginationComponent],
  providers: [NewsIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class NewsIndexPage implements OnInit, NewsIndexView {
  private presenter = inject(NewsIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  news = signal<News[]>([]);
  loading = signal(true);
  status = '';
  page = signal(1);
  count = signal(0);
  readonly limit = 10;
  busy = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('news.create');
  canUpdate = this.auth.hasPermission('news.update');
  canPublish = this.auth.hasPermission('news.publish');
  canDelete = this.auth.hasPermission('news.delete');

  ngOnInit(): void { this.presenter.attachView(this); this.load(); }

  load(): void { this.loading.set(true); this.presenter.load(this.page(), this.limit, this.status); }
  filter(s: string): void { this.status = s; this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  togglePublish(n: News): void { this.setBusy(n.newsID); this.presenter.togglePublish(n); }
  async remove(n: News): Promise<void> {
    const ok = await this.alert.confirm(`Hapus berita "${n.newsTitle}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Berita', confirmLabel: 'Ya, Hapus', variant: 'danger',
    });
    if (!ok) return;
    this.setBusy(n.newsID);
    this.presenter.remove(n);
  }

  setNews(news: News[], count: number): void { this.news.set(news); this.count.set(count); this.loading.set(false); }
  onPublishToggleSuccess(_wasPublished: boolean): void { this.load(); }
  onRemoveSuccess(): void { this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
