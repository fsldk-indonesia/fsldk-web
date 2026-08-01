import { DashboardSummary, RecentNewsItem } from '../../entities/dashboard-summary';

export interface DashboardIndexView {
  setSummary(summary: DashboardSummary): void;
  setRecentNews(items: RecentNewsItem[]): void;
}
