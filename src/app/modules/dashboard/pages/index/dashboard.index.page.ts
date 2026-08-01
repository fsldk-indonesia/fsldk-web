import { Component, OnInit, inject, signal } from '@angular/core';
import { DashboardSummary, RecentNewsItem } from '../../entities/dashboard-summary';
import { DashboardIndexPresenter } from './dashboard.index.presenter';
import { DashboardIndexView } from './dashboard.index.view';

@Component({
  selector: 'app-dashboard-index-page',
  standalone: true,
  templateUrl: './dashboard.index.page.html',
  providers: [DashboardIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .stat { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); }
    .stat-label { color: var(--color-text-secondary); font-size: .9rem; } .stat-num { display: block; font-family: var(--font-heading); font-weight: 800; font-size: 2.6rem; margin-top: 8px; }
  `],
})
export class DashboardIndexPage implements OnInit, DashboardIndexView {
  private presenter = inject(DashboardIndexPresenter);

  summary = signal<DashboardSummary | null>(null);
  recentNews = signal<RecentNewsItem[]>([]);

  ngOnInit(): void { this.presenter.attachView(this); this.presenter.load(); }

  setSummary(summary: DashboardSummary): void { this.summary.set(summary); }
  setRecentNews(items: RecentNewsItem[]): void { this.recentNews.set(items); }
}
