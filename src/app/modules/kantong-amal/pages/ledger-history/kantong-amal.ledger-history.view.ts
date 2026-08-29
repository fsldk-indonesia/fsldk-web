import { LedgerListItem } from '../../entities/wallet';

export interface KantongAmalLedgerHistoryView {
  setLoading(loading: boolean): void;
  setLedger(items: LedgerListItem[], count: number): void;
}
