export interface Article {
  articleID: number;
  articleTitle: string;
  articleSlug: string;
  articleIntro: string;
  articleImage: string | null;
  articleWriter: string | null;
  articleEditor: string | null;
  articlePdf: string | null;
  categoryID: number;
  categoryName: string;
  isPublished: boolean;
  publishedDate: string | null;
  authorName: string;
  createdDate: string;
}
