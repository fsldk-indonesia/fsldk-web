import { GoldPrice } from '../../entities/gold-price';
import { ZakatResult } from '../../zakat.compute';

export type FetchStatus = 'idle' | 'loading' | 'ok' | 'fail';

/** Methods the presenter calls on the calculator page. */
export interface ZakatCalculatorView {
  setGoldPrice(price: GoldPrice): void;
  setNisabHint(hint: string): void;
  setResult(result: ZakatResult): void;
  setFetchStatus(status: FetchStatus, message?: string): void;
}
