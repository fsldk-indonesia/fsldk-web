import { FinanceFormat } from './finance-format';
import { FinanceFormatType } from './finance-format-type';

/** Combined payload of GET /public/finance-formats — one request feeds the
 *  whole public page; the frontend groups `formats` by `formatTypeID`. */
export interface FinanceFormatPublicList {
  formatTypes: FinanceFormatType[];
  formats: FinanceFormat[];
  cpName: string;
  cpPhone: string;
}
