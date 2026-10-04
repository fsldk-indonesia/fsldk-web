export interface News {
  newsID: number;
  newsTitle: string;
  newsSlug: string;
  newsExcerpt: string | null;
  newsContent: string;
  newsImage: string | null;
  newsPublisher: string | null;
  newsReporter: string | null;
  newsEditor: string | null;
  categoryID: number;
  categoryName: string;
  isFeatured: boolean;
  isPublished: boolean;
  publishedDate: string | null;
  viewCount: number;
  authorName: string;
  createdDate: string;
}

/** Nilai distinct yang mengisi dropdown filter publik "Filter Berita"
 *  (Tahun Terbit/Penulis) — lihat GET /public/news/filter-options, pola
 *  sama seperti GalleryFilterOptions. */
export interface NewsFilterOptions {
  years: number[];
  reporters: string[];
}
