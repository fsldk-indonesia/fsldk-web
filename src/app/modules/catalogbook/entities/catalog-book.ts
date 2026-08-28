export interface CatalogBook {
  bookID: number;
  bookSlug: string;
  isbn: string | null;
  bookTitle: string;
  authorName: string;
  authorTypeID: number;
  authorTypeName: string;
  publisherName: string;
  bookCategoryID: number;
  bookCategoryName: string;
  languageID: number;
  languageName: string;
  availabilityTypeID: number;
  availabilityTypeName: string;
  bookPdf: string | null;
  year: string;
  pages: number;
  description: string;
  synopsis: string | null;
  edition: string | null;
  coverImage: string | null;
  favoriteCount: number;
  tags: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
  isActive: boolean;
  createdDate: string;
}
