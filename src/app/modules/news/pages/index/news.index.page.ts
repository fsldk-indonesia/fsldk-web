import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { News } from '../../entities/news';
import { NewsIndexPresenter } from './news.index.presenter';
import { NewsIndexView } from './news.index.view';

@Component({
  selector: 'app-news-index-page',
  standalone: true,
  templateUrl: './news.index.page.html',
  imports: [RouterLink, DatePipe],
  providers: [NewsIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class NewsIndexPage implements OnInit, NewsIndexView {
  private presenter = inject(NewsIndexPresenter);
  private auth = inject(AuthRepository);

  news = signal<News[]>([]);
  status = '';
  canCreate = this.auth.hasPermission('news.create');
  canUpdate = this.auth.hasPermission('news.update');
  canPublish = this.auth.hasPermission('news.publish');
  canDelete = this.auth.hasPermission('news.delete');

  ngOnInit(): void { this.presenter.attachView(this); this.load(); }

  load(): void { this.presenter.load(this.status); }
  filter(s: string): void { this.status = s; this.load(); }
  togglePublish(n: News): void { this.presenter.togglePublish(n); }
  remove(n: News): void {
    if (!confirm(`Hapus berita "${n.newsTitle}"?`)) return;
    this.presenter.remove(n);
  }

  setNews(news: News[]): void { this.news.set(news); }
  onPublishToggleSuccess(_wasPublished: boolean): void { this.load(); }
  onRemoveSuccess(): void { this.load(); }
}
