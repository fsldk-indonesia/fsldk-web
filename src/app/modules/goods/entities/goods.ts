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
}

/** Produk beserta gallery gambarnya — dipakai endpoint detail publik & CMS get. */
export interface GoodsDetail extends Goods {
  images: string[];
}
