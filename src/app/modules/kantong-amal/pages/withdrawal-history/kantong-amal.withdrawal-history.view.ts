import { Withdrawal } from '../../entities/withdrawal';

export interface KantongAmalWithdrawalHistoryView {
  setLoading(loading: boolean): void;
  setWithdrawals(withdrawals: Withdrawal[]): void;
  onCancelSuccess(): void;
}
