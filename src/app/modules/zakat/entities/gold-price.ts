/** Body of GET /public/zakat/gold-price. `success` is false when the upstream
 *  provider failed and `price` is the backend fallback value. */
export interface GoldPrice {
  success: boolean;
  price: number;
  source: 'antam-live' | 'fallback';
  cachedAt: string;
}
