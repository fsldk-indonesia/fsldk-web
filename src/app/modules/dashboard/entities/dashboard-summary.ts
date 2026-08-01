export interface DashboardSummary {
  totalNews: number;
  publishedNews: number;
  draftNews: number;
  totalUsers: number;
}

export interface RecentNewsItem {
  newsID: number;
  newsTitle: string;
  isPublished: boolean;
}
