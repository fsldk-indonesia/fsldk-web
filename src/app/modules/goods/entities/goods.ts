export type GoodsAvailability = 'available' | 'out_of_stock' | 'coming_soon';

export interface Goods {
  goodsID: number;
  goodsName: string;
  goodsSlug: string;
  skuCode: string | null;
  goodsCategoryID: number;
  categoryName: string;
  shortDescription: string | null;
  fullDescription: string | null;
  price: number;
  mainImageUrl: string | null;
  availabilityStatus: GoodsAvailability;
  isFeatured: boolean;
  isPublished: boolean;
  publishedDate: string | null;
  sortOrder: number;
  purchaseUrl: string;
  purchaseButtonLabel: string;
  createdDate: string;
  /** Cuplikan gallery singkat (maks. 3) — hanya diisi oleh endpoint public
   *  list (dipakai kartu "shop.app style" di Beranda), kosong/undefined di
   *  konteks lain (CMS list, dsb). */
  previewImages?: string[];
}

/** Produk beserta gallery gambarnya — dipakai endpoint detail publik & CMS get. */
export interface GoodsDetail extends Goods {
  images: string[];
}
