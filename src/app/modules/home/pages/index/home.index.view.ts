import { News } from '../../../news/entities/news';
import { Article } from '../../../article/entities/article';
import { CatalogBook } from '../../../catalogbook/entities/catalog-book';
import { EventListItem } from '../../../event/entities/event';
import { Goods } from '../../../goods/entities/goods';
import { CalendarCell } from '../../../schedule/entities/schedule';
import { Campaign, CampaignPublicStats } from '../../../kantong-amal/entities/campaign';
import { GalleryFeature } from '../../../gallery/entities/gallery';

export interface HomeIndexView {
  setLoading(loading: boolean): void;
  setNews(news: News[]): void;
  setArticles(articles: Article[]): void;
  setCatalogBooks(books: CatalogBook[]): void;
  setEvents(events: EventListItem[]): void;
  setGoods(goods: Goods[]): void;
  setSchedulePeriodLabel(label: string): void;
  setScheduleWeeks(weeks: CalendarCell[][]): void;
  setCampaigns(campaigns: Campaign[]): void;
  setCampaignStats(stats: CampaignPublicStats | null): void;
  setGalleryFeature(feature: GalleryFeature | null): void;
  setContactEmail(email: string): void;
}
