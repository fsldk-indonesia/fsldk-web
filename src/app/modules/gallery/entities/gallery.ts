/**
 * Entity definitions and request payload interfaces for the Gallery module.
 */

export interface GalleryPhoto {
  photoID: number;
  galleryID: number;
  imagePath: string;
  caption: string | null;
  sortOrder: number;
  uploadedDate?: string;
}

export interface PhotoPage {
  galleryID: number;
  data: GalleryPhoto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GalleryListItem {
  galleryID: number;
  eventName: string;
  eventTheme: string;
  gallerySlug: string;
  eventDate?: string | null;
  coverImage: string;
  youtubeVideoID: string | null;
  totalPhotos: number;
  createdDate: string;
}

/** Opsi dropdown filter publik "Tahun Kegiatan"/"Nama Kegiatan" (lihat
 *  GalleryApiService.getPublicFilterOptions) — nilai distinct dari data yang
 *  sudah ada, supaya UI tidak pernah menawarkan opsi yang hasilnya kosong. */
export interface GalleryFilterOptions {
  years: number[];
  eventNames: string[];
}

export interface Gallery extends GalleryListItem {
  eventDescription: string;
  documentLink: string | null;
}

/** Galeri terbaru + halaman foto pertamanya — dipakai kartu "Dokumentasi
 *  Kegiatan Terbaru" di beranda (lihat home.index.page.ts), butuh detail
 *  (eventDescription/documentLink) dan foto yang tidak ada di GalleryListItem. */
export interface GalleryFeature {
  gallery: Gallery;
  photos: GalleryPhoto[];
}

export interface CreatePhotoItemReq {
  imagePath: string;
  caption?: string | null;
  sortOrder?: number;
}

export interface GalleryCreateReq {
  eventName: string;
  eventTheme: string;
  eventDate?: string | null;
  eventDescription: string;
  coverImage: string;
  youtubeVideoID?: string | null;
  documentLink?: string | null;
  photos?: CreatePhotoItemReq[];
}

export interface GalleryUpdateReq {
  eventName: string;
  eventTheme: string;
  eventDate?: string | null;
  eventDescription: string;
  coverImage: string;
  youtubeVideoID?: string | null;
  documentLink?: string | null;
}

export interface AddPhotoReq {
  imagePath: string;
  caption?: string | null;
  sortOrder?: number;
}

export interface UpdatePhotoReq {
  caption?: string | null;
  sortOrder?: number;
}

export interface ReorderPhotosReq {
  order: number[];
}
