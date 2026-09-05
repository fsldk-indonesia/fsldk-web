import { News } from '../../../news/entities/news';
import { Article } from '../../../article/entities/article';
import { CatalogBook } from '../../../catalogbook/entities/catalog-book';
import { EventListItem } from '../../../event/entities/event';
import { Goods } from '../../../goods/entities/goods';
import { Schedule } from '../../../schedule/entities/schedule';
import { Campaign } from '../../../kantong-amal/entities/campaign';

export interface HomeIndexView {
  setLoading(loading: boolean): void;
  setNews(news: News[]): void;
  setArticles(articles: Article[]): void;
  setCatalogBooks(books: CatalogBook[]): void;
  setEvents(events: EventListItem[]): void;
  setGoods(goods: Goods[]): void;
  setSchedules(schedules: Schedule[]): void;
  setCampaigns(campaigns: Campaign[]): void;
}
