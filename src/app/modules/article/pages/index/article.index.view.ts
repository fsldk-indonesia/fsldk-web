import { Article } from '../../entities/article';

export interface ArticleIndexView {
  setArticles(articles: Article[], count: number): void;
  onPublishToggleSuccess(): void;
  onRemoveSuccess(): void;
  onActionSettled(id: number): void;
}
