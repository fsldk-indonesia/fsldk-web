import { News } from '../../entities/news';

export interface NewsIndexView {
  setNews(news: News[], count: number): void;
  onPublishToggleSuccess(wasPublished: boolean): void;
  onRemoveSuccess(): void;
}
