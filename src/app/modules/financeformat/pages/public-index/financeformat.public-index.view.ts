import { FinanceFormatPublicList } from '../../entities/finance-format-public';

export interface FinanceFormatPublicIndexView {
  setLoading(loading: boolean): void;
  setData(data: FinanceFormatPublicList): void;
}
