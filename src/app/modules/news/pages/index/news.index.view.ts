import { News } from '../../entities/news';

export interface NewsIndexView {
  setNews(news: News[]): void;
  onPublishToggleSuccess(wasPublished: boolean): void;
  onRemoveSuccess(): void;
}
