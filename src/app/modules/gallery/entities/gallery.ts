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
  eventDate?: string | null;
  coverImage: string;
  youtubeVideoID: string | null;
  totalPhotos: number;
  createdDate: string;
}

export interface Gallery extends GalleryListItem {
  eventDescription: string;
  documentLink: string | null;
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
